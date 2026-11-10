-- Migration: 20261110000000_checkout_enhancements_and_notifications.sql
-- 1. Function to safely decrement product stock during customer checkout
CREATE OR REPLACE FUNCTION decrement_product_stock_safe(p_product_id uuid, p_quantity integer)
RETURNS boolean AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(0, stock_quantity - p_quantity)
  WHERE id = p_product_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger: Notify each Supplier when an order item belonging to them is placed
CREATE OR REPLACE FUNCTION notify_supplier_on_new_order_item() RETURNS TRIGGER AS $$
DECLARE
  v_supplier_user_id uuid;
  v_order_number text;
BEGIN
  -- Find the supplier's auth user_id from the suppliers table
  SELECT user_id INTO v_supplier_user_id FROM suppliers WHERE id = NEW.supplier_id;
  SELECT order_number INTO v_order_number FROM orders WHERE id = NEW.order_id;

  IF v_supplier_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, payload)
    VALUES (
      v_supplier_user_id,
      'New Order Received',
      'New order #' || COALESCE(v_order_number, '') || ' received for ' || NEW.product_name || ' (Qty: ' || NEW.quantity || ')',
      'new_order',
      jsonb_build_object('order_id', NEW.order_id, 'item_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_order_item_notify_supplier ON order_items;
CREATE TRIGGER on_new_order_item_notify_supplier
AFTER INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION notify_supplier_on_new_order_item();

-- 3. Trigger: Notify Chat Participant on new message
CREATE OR REPLACE FUNCTION notify_chat_message() RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id uuid;
  v_sender_name text;
BEGIN
  SELECT full_name INTO v_sender_name FROM profiles WHERE id = NEW.sender_id;

  FOR v_recipient_id IN
    SELECT user_id FROM chat_participants
    WHERE room_id = NEW.room_id AND user_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, payload)
    VALUES (
      v_recipient_id,
      'New Message from ' || COALESCE(v_sender_name, 'User'),
      SUBSTRING(NEW.message FROM 1 FOR 80),
      'new_message',
      jsonb_build_object('room_id', NEW.room_id, 'message_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_chat_message_notify ON chat_messages;
CREATE TRIGGER on_chat_message_notify
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION notify_chat_message();
