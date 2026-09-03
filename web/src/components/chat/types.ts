/** Shared shapes + label helpers for the chat screens (port of mobile `app/chat/*`). */

import type { ChatMessage } from '@/types/database';

export type ChatRole = 'customer' | 'b2b' | 'supplier' | 'admin' | string;

/**
 * A `chat_messages` row. Optimistic rows reuse the same shape with an
 * `optimistic-` prefixed id until the insert returns.
 */
export type ChatMessageRecord = ChatMessage;

/**
 * A participant's profile. `is_online` / `last_seen_at` were added to `profiles`
 * by `20260408120000_chat_system.sql` and are maintained by the 30s heartbeat
 * mobile runs while a chat room is open; they are NOT in `types/database.ts`,
 * which is why every read/write of them goes through the untyped client.
 */
export type ParticipantProfile = {
  id: string;
  full_name: string | null;
  role: ChatRole;
  is_online: boolean | null;
  last_seen_at: string | null;
};

export type LastMessage = {
  message: string;
  created_at: string;
  sender_id: string | null;
};

export type ChatRoomSummary = {
  id: string;
  room_type: 'p2p' | 'support';
  created_at: string;
  updated_at: string;
  /** `null` for a support room whose admin has not joined as a participant. */
  other_participant: ParticipantProfile | null;
  last_message: LastMessage | null;
  unread_count: number;
};

/** Placeholder counterparty mobile shows on a support room with no admin participant. */
export const SUPPORT_COUNTERPARTY_NAME = 'App Owner (Admin)';

/** Mobile `getRoleLabel()` — admin reads as "Support" everywhere in chat. */
export function roleLabel(role: ChatRole | null | undefined): string {
  if (!role) return '';
  switch (role) {
    case 'admin':
      return 'Support';
    case 'supplier':
      return 'Supplier';
    case 'b2b':
      return 'Wholesaler';
    default:
      return 'Customer';
  }
}

/** Mobile `getRoleColor()` mapped onto the web palette's semantic tones. */
export function roleTone(
  role: ChatRole | null | undefined
): 'neutral' | 'warning' | 'success' | 'info' | 'primary' {
  switch (role) {
    case 'admin':
      return 'warning';
    case 'supplier':
      return 'success';
    case 'b2b':
      return 'primary';
    case 'customer':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Title mobile renders for a room: a support room hides the admin's real name. */
export function roomTitle(room: ChatRoomSummary, viewerIsAdmin: boolean): string {
  if (room.room_type === 'support' && !viewerIsAdmin) return 'App Support Team';
  return room.other_participant?.full_name || 'Anonymous User';
}

/** Mobile `formatTime()` — 12h clock, e.g. "9:05 PM". */
export function formatMessageTime(value: string, locale = 'en-US') {
  return new Date(value).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Day separator inside a conversation. */
export function formatMessageDay(value: string, locale = 'en-US') {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Relative stamp for the conversation list / last-seen line. */
export function formatRelativeTime(value: string, locale = 'en-US') {
  const then = new Date(value).getTime();
  const diffMinutes = Math.round((Date.now() - then) / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)}h ago`;
  if (diffMinutes < 60 * 24 * 7) return `${Math.floor(diffMinutes / (60 * 24))}d ago`;

  return new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * The 5-minute freshness window `handle_chat_auto_response()` uses to decide
 * whether an admin counts as online. Reused here so the UI agrees with the DB.
 */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isOnline(profile: ParticipantProfile | null): boolean {
  if (!profile?.is_online || !profile.last_seen_at) return false;
  return Date.now() - new Date(profile.last_seen_at).getTime() < ONLINE_WINDOW_MS;
}

/** Mobile maps language codes onto Intl locales; mirrored from `components/orders/types.ts`. */
export function localeFor(code: string) {
  switch (code) {
    case 'el':
      return 'el-GR';
    case 'fr':
      return 'fr-FR';
    case 'es':
      return 'es-ES';
    default:
      return 'en-US';
  }
}
