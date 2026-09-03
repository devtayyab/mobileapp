import { notFound } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ChatRoomView } from '@/components/chat/ChatRoomView';
import { fetchRoomContext } from '@/components/chat/roomQueries';
import type { ChatMessageRecord } from '@/components/chat/types';

export const dynamic = 'force-dynamic';

/** Realtime 1:1 conversation — port of mobile `app/chat/[id].tsx`. */
export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireRole(['customer', 'b2b', 'supplier', 'admin']);
  const supabase = await createClient();

  // Untyped for the embedded participants/profiles select — see roomQueries.ts.
  const room = await fetchRoomContext(supabase as unknown as SupabaseClient, id, user.id);

  // RLS returns no row when the viewer may not read this room, so a blocked
  // room and a deleted room are indistinguishable — both are a 404.
  if (!room) notFound();

  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', id)
    .order('created_at', { ascending: true });

  return (
    <ChatRoomView
      roomId={room.id}
      roomType={room.room_type}
      viewerId={user.id}
      counterparty={room.counterparty}
      initialMessages={(data ?? []) as ChatMessageRecord[]}
    />
  );
}
