/**
 * Chat reads shared by the server pages and the client components.
 *
 * Every function takes an **untyped** `SupabaseClient`: `types/database.ts`
 * declares `Relationships: []` for all tables, so PostgREST embedded selects
 * and embedded filters (`chat_participants!inner(user_id)`) are not expressible
 * in its column unions — same escape hatch as `ProductSupplierCard.tsx`.
 * `profiles.is_online` / `last_seen_at` are also missing from `ProfileRow`,
 * which is a second reason these calls stay untyped.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatRoomSummary, LastMessage, ParticipantProfile } from './types';

/** Newest rooms only — mobile fetches every room it can read, which does not scale for admins. */
const MAX_ROOMS = 100;

type RawProfile = {
  id: string;
  full_name: string | null;
  role: string;
  is_online: boolean | null;
  last_seen_at: string | null;
};

type RawParticipant = {
  user_id: string | null;
  /** PostgREST returns an object for a to-one embed, but older versions return an array. */
  profiles: RawProfile | RawProfile[] | null;
};

type RawRoom = {
  id: string;
  room_type: 'p2p' | 'support';
  created_at: string;
  updated_at: string;
  chat_participants: RawParticipant[] | null;
  all_participants?: RawParticipant[] | null;
};

const PARTICIPANT_SELECT =
  'user_id, profiles ( id, full_name, role, is_online, last_seen_at )';

function firstProfile(participant: RawParticipant | undefined): ParticipantProfile | null {
  if (!participant) return null;
  const raw = Array.isArray(participant.profiles)
    ? participant.profiles[0]
    : participant.profiles;
  if (!raw) return null;

  return {
    id: raw.id,
    full_name: raw.full_name,
    role: raw.role,
    is_online: raw.is_online,
    last_seen_at: raw.last_seen_at,
  };
}

function otherParticipant(
  participants: RawParticipant[] | null | undefined,
  viewerId: string
): ParticipantProfile | null {
  return firstProfile((participants ?? []).find((p) => p.user_id !== viewerId));
}

/**
 * Conversation list. Port of mobile `fetchChatRooms()`:
 * admins read every room, everyone else only rooms they participate in.
 * Last message is fetched per room (as mobile does); unread counts are batched
 * into one query instead of mobile's per-room `count: 'exact'` round-trips.
 */
export async function fetchChatRooms(
  supabase: SupabaseClient,
  viewerId: string,
  viewerIsAdmin: boolean
): Promise<ChatRoomSummary[]> {
  let rooms: RawRoom[];

  if (viewerIsAdmin) {
    // RLS "Users can view own chat rooms" has an admin-role branch, so this
    // really does return other people's rooms.
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(
        `id, room_type, created_at, updated_at, chat_participants ( ${PARTICIPANT_SELECT} )`
      )
      .order('updated_at', { ascending: false })
      .limit(MAX_ROOMS);

    if (error) throw error;
    rooms = (data ?? []) as RawRoom[];
  } else {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(
        `id, room_type, created_at, updated_at,
         chat_participants!inner ( user_id ),
         all_participants:chat_participants ( ${PARTICIPANT_SELECT} )`
      )
      .eq('chat_participants.user_id', viewerId)
      .order('updated_at', { ascending: false })
      .limit(MAX_ROOMS);

    if (error) throw error;
    rooms = ((data ?? []) as RawRoom[]).map((room) => ({
      ...room,
      // `chat_participants` is narrowed to the viewer by the !inner filter;
      // `all_participants` is the unfiltered copy carrying the profiles.
      chat_participants: room.all_participants ?? [],
    }));
  }

  const roomIds = rooms.map((room) => room.id);
  if (roomIds.length === 0) return [];

  const [unread, lastMessages] = await Promise.all([
    // Messages from the counterparty that are still unread, in one round-trip.
    supabase
      .from('chat_messages')
      .select('room_id')
      .in('room_id', roomIds)
      .eq('is_read', false)
      .neq('sender_id', viewerId),
    Promise.all(
      roomIds.map(async (roomId) => {
        const { data } = await supabase
          .from('chat_messages')
          .select('message, created_at, sender_id')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return [roomId, (data as LastMessage | null) ?? null] as const;
      })
    ),
  ]);

  const unreadByRoom = new Map<string, number>();
  for (const row of (unread.data ?? []) as { room_id: string | null }[]) {
    if (!row.room_id) continue;
    unreadByRoom.set(row.room_id, (unreadByRoom.get(row.room_id) ?? 0) + 1);
  }

  const lastByRoom = new Map(lastMessages);

  const summaries: ChatRoomSummary[] = rooms.map((room) => ({
    id: room.id,
    room_type: room.room_type,
    created_at: room.created_at,
    updated_at: room.updated_at,
    other_participant: otherParticipant(room.chat_participants, viewerId),
    last_message: lastByRoom.get(room.id) ?? null,
    unread_count: unreadByRoom.get(room.id) ?? 0,
  }));

  // Mobile drops p2p rooms whose counterparty is gone; support rooms survive
  // because the admin may not have joined yet.
  return summaries
    .filter((room) => room.other_participant !== null || room.room_type === 'support')
    .sort((a, b) => sortKey(b) - sortKey(a));
}

/**
 * `chat_rooms.updated_at` is never bumped on send (no trigger, and neither app
 * writes it), so the freshest signal is the last message's timestamp.
 */
function sortKey(room: ChatRoomSummary) {
  return new Date(room.last_message?.created_at ?? room.updated_at).getTime();
}

export type RoomContext = {
  id: string;
  room_type: 'p2p' | 'support';
  counterparty: ParticipantProfile | null;
};

/** Port of mobile `loadRoomDetails()`. Returns null when the room is unreadable. */
export async function fetchRoomContext(
  supabase: SupabaseClient,
  roomId: string,
  viewerId: string
): Promise<RoomContext | null> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select(`id, room_type, chat_participants ( ${PARTICIPANT_SELECT} )`)
    .eq('id', roomId)
    .maybeSingle();

  if (error || !data) return null;

  const room = data as RawRoom;

  return {
    id: room.id,
    room_type: room.room_type,
    counterparty: otherParticipant(room.chat_participants, viewerId),
  };
}

/** Fresh presence for the counterparty; polled while a room is open. */
export async function fetchPresence(
  supabase: SupabaseClient,
  profileId: string
): Promise<Pick<ParticipantProfile, 'is_online' | 'last_seen_at'> | null> {
  const { data } = await supabase
    .from('profiles')
    .select('is_online, last_seen_at')
    .eq('id', profileId)
    .maybeSingle();

  if (!data) return null;
  const row = data as { is_online: boolean | null; last_seen_at: string | null };
  return { is_online: row.is_online, last_seen_at: row.last_seen_at };
}
