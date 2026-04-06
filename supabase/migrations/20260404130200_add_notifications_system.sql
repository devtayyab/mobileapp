-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'order_status', 'new_order', 'new_product', 'system'
  is_read boolean DEFAULT false,
  payload jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Ensure payload column exists if table was created without it
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'payload'
  ) THEN
    ALTER TABLE notifications ADD COLUMN payload jsonb DEFAULT '{}';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable Realtime for notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Function to trigger notification on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type, payload)
    VALUES (
      NEW.user_id,
      'Order Update',
      'Your order #' || NEW.order_number || ' status has changed to ' || NEW.status,
      'order_status',
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order status change
DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Function to trigger notification on new order (for admins and customer)
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- 1. Notify the Customer who placed the order
  INSERT INTO notifications (user_id, title, message, type, payload)
  VALUES (
    NEW.user_id,
    'Order Placed Successfully!',
    'Your order #' || NEW.order_number || ' has been received and is being processed.',
    'order_status',
    jsonb_build_object('order_id', NEW.id)
  );

  -- 2. Notify ALL Admins
  FOR admin_id IN SELECT id FROM profiles WHERE role = 'admin' LOOP
    INSERT INTO notifications (user_id, title, message, type, payload)
    VALUES (
      admin_id,
      'New Order Received',
      'Order #' || NEW.order_number || ' has been placed.',
      'new_order',
      jsonb_build_object('order_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new order
DROP TRIGGER IF EXISTS on_new_order ON orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- Function to trigger notification on new product (to ALL users)
CREATE OR REPLACE FUNCTION notify_new_product()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Notify ALL users (customers, b2b, and suppliers)
  FOR target_user_id IN SELECT id FROM profiles LOOP
    INSERT INTO notifications (user_id, title, message, type, payload)
    VALUES (
      target_user_id,
      'New Arrival!',
      NEW.name || ' is now available. Check it out!',
      'new_product',
      jsonb_build_object('product_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new product
DROP TRIGGER IF EXISTS on_new_product ON products;
CREATE TRIGGER on_new_product
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_product();
