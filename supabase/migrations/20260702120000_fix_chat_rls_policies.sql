-- Fix Chat RLS Policies
-- 1. Add missing UPDATE policy on chat_rooms (needed for updating updated_at on message send)
DROP POLICY IF EXISTS "Users can update own chat rooms" ON chat_rooms;
CREATE POLICY "Users can update own chat rooms" ON chat_rooms
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (true);

-- 2. Broaden chat_messages SELECT policy to allow room creator to view messages
-- (handles support rooms where admin is not a participant but created_by is the user)
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON chat_messages;
CREATE POLICY "Users can view messages in their rooms" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.room_id = chat_messages.room_id
      AND chat_participants.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
      AND chat_rooms.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Broaden chat_messages INSERT policy to allow room creator to send messages
-- (handles support rooms where the room creator may not be a participant record)
DROP POLICY IF EXISTS "Users can send messages in their rooms" ON chat_messages;
CREATE POLICY "Users can send messages in their rooms" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM chat_participants
        WHERE chat_participants.room_id = chat_messages.room_id
        AND chat_participants.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_messages.room_id
        AND chat_rooms.created_by = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );
