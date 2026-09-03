/*
  SECURITY FIX — private conversations were readable by any authenticated user.

  Problem (introduced in 20260408120000_chat_system.sql):
    chat_participants SELECT  USING (true)
    chat_participants INSERT  WITH CHECK (true)

  Because chat_messages SELECT grants access to anyone who is a participant of
  the room, the permissive INSERT above was an privilege-escalation path: any
  authenticated user could insert a row naming themselves as a participant of an
  arbitrary room_id and then read that room's entire message history. The
  permissive SELECT additionally leaked the full participant graph (who is
  talking to whom) to every logged-in user.

  Fix:
    - SELECT: your own rows, rooms you already participate in, or admin.
    - INSERT: yourself only, or someone else ONLY into a room you created
      (needed by the find-or-create p2p flow, which inserts both sides), or admin.

  is_room_participant() is SECURITY DEFINER for the same reason is_admin() is:
  a policy on chat_participants that queries chat_participants would otherwise
  recurse infinitely.

  !! Verify before relying on this in production. It tightens live behavior, so
  exercise these flows after applying: product page "chat with supplier",
  admin "start chat" from users/support, and "chat with support".
*/

create or replace function is_room_participant(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from chat_participants
    where chat_participants.room_id = p_room_id
      and chat_participants.user_id = auth.uid()
  );
$$;

grant execute on function is_room_participant(uuid) to authenticated;

-- ── SELECT ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view participants of their rooms" ON chat_participants;
CREATE POLICY "Users can view participants of their rooms" ON chat_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_room_participant(room_id)
    OR is_admin()
  );

-- ── INSERT ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can add participants" ON chat_participants;
CREATE POLICY "Users can add participants" ON chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    -- add yourself
    user_id = auth.uid()
    -- or add the counterparty to a room you opened
    OR EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = room_id
        AND chat_rooms.created_by = auth.uid()
    )
    OR is_admin()
  );

/*
  Related gap, fixed here too: 20260703120000 added an is_read UPDATE policy
  scoped to `participant AND sender_id != auth.uid()`, with no admin or
  room-creator branch. In a support room the admin usually is not a
  chat_participants row, so their "mark as read" silently updated 0 rows and the
  sender never saw a read receipt. Both apps had this bug.
*/
DROP POLICY IF EXISTS "Users can update received messages" ON chat_messages;
CREATE POLICY "Users can update received messages" ON chat_messages
  FOR UPDATE TO authenticated
  USING (
    sender_id IS DISTINCT FROM auth.uid()
    AND (
      is_room_participant(room_id)
      OR EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_messages.room_id
          AND chat_rooms.created_by = auth.uid()
      )
      OR is_admin()
    )
  );
