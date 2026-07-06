-- Add UPDATE policy for chat_messages to allow marking messages as read
DROP POLICY IF EXISTS "Users can update received messages" ON chat_messages;
CREATE POLICY "Users can update received messages" ON chat_messages
  FOR UPDATE TO authenticated
  USING (
    -- Can only update messages in a room they are a part of
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.room_id = chat_messages.room_id
      AND chat_participants.user_id = auth.uid()
    )
    -- But cannot update their own messages (can only mark others' messages as read)
    AND sender_id != auth.uid()
  );
