-- 1. Add online status and activity tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- 2. Create Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type text NOT NULL CHECK (room_type IN ('p2p', 'support')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create Chat Participants Table
CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 4. Create Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Chat Rooms
DROP POLICY IF EXISTS "Users can view own chat rooms" ON chat_rooms;
CREATE POLICY "Users can view own chat rooms" ON chat_rooms
  FOR SELECT TO authenticated
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
  );

DROP POLICY IF EXISTS "Users can insert chat rooms" ON chat_rooms;
CREATE POLICY "Users can insert chat rooms" ON chat_rooms
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 7. RLS Policies for Chat Participants
DROP POLICY IF EXISTS "Users can view participants of their rooms" ON chat_participants;
CREATE POLICY "Users can view participants of their rooms" ON chat_participants
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can add participants" ON chat_participants;
CREATE POLICY "Users can add participants" ON chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 8. RLS Policies for Chat Messages
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
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

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
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- 9. Enable Realtime for Chat Tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_participants') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;

-- 10. Automated Offline Responder for Admins/Owner
CREATE OR REPLACE FUNCTION handle_chat_auto_response() RETURNS TRIGGER AS $$
DECLARE
  is_support_room boolean;
  is_sender_admin boolean;
  online_admins_count integer;
  first_admin_id uuid;
BEGIN
  -- 1. Check if the message is inside a support room
  SELECT (room_type = 'support') INTO is_support_room
  FROM chat_rooms
  WHERE id = NEW.room_id;

  IF NOT is_support_room THEN
    RETURN NEW;
  END IF;

  -- 2. Check if the sender is an admin (we don't respond to admins)
  SELECT (role = 'admin') INTO is_sender_admin
  FROM profiles
  WHERE id = NEW.sender_id;

  IF is_sender_admin THEN
    RETURN NEW;
  END IF;

  -- 3. Check count of online admins (online status true and active in last 5 minutes)
  SELECT COUNT(*) INTO online_admins_count
  FROM profiles
  WHERE role = 'admin'
  AND is_online = true
  AND last_seen_at >= now() - INTERVAL '5 minutes';

  -- 4. If no admins are online, trigger the auto-response message
  IF online_admins_count = 0 THEN
    -- Find the first admin to act as the sender of the auto-response
    SELECT id INTO first_admin_id
    FROM profiles
    WHERE role = 'admin'
    LIMIT 1;

    -- If we found an admin, insert the auto-reply message
    IF first_admin_id IS NOT NULL THEN
      INSERT INTO chat_messages (room_id, sender_id, message)
      VALUES (
        NEW.room_id,
        first_admin_id,
        'We received your message, we will answer to you shortly.'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_chat_message_insert ON chat_messages;
CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_chat_auto_response();
