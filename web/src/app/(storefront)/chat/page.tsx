import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import { fetchChatRooms } from '@/components/chat/roomQueries';
import type { ChatRoomSummary } from '@/components/chat/types';

export const dynamic = 'force-dynamic';

/** Conversation list — port of mobile `app/chat/index.tsx`. */
export default async function ChatPage() {
  const { user, profile } = await requireRole(['customer', 'b2b', 'supplier', 'admin']);
  const supabase = await createClient();

  const isAdmin = profile.role === 'admin';

  let rooms: ChatRoomSummary[] = [];
  try {
    // Untyped: the embedded participant/profile select is not expressible in
    // the generated types (`Relationships: []`). See roomQueries.ts.
    rooms = await fetchChatRooms(supabase as unknown as SupabaseClient, user.id, isAdmin);
  } catch (err) {
    console.error('Error fetching chat rooms:', err);
  }

  return <ChatRoomList initialRooms={rooms} viewerId={user.id} viewerIsAdmin={isAdmin} />;
}
