/*
  # Add Notifications Table and Enhancements

  ## Changes

  ### 1. New Tables
  - `notifications` - In-app notification system for all user types
    - Supports order updates, KYC status changes, payment confirmations
    - Role-based delivery (customer, supplier, admin)
    - Read/unread tracking

  ### 2. Modified Tables
  - `suppliers` - Ensure rejection_reason column exists
  - `kyc_documents` - Ensure all columns exist properly

  ### 3. Security
  - RLS enabled on notifications table
  - Users can only see their own notifications
  - Admins can insert notifications for any user
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  related_id uuid,
  related_type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Ensure suppliers table has rejection_reason
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Ensure suppliers table has reviewed_at and reviewed_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN reviewed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN reviewed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Ensure kyc_documents has reviewed_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kyc_documents' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE kyc_documents ADD COLUMN reviewed_at timestamptz;
  END IF;
END $$;

-- Ensure kyc_documents has rejection_reason
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kyc_documents' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE kyc_documents ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Add shipments policy for supplier to update tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipments' AND policyname = 'Suppliers can insert shipments for their orders'
  ) THEN
    CREATE POLICY "Suppliers can insert shipments for their orders"
      ON shipments FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM suppliers
          WHERE suppliers.id = shipments.supplier_id
          AND suppliers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shipments' AND policyname = 'Suppliers can update their shipments'
  ) THEN
    CREATE POLICY "Suppliers can update their shipments"
      ON shipments FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM suppliers
          WHERE suppliers.id = shipments.supplier_id
          AND suppliers.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM suppliers
          WHERE suppliers.id = shipments.supplier_id
          AND suppliers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Admin policy for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can manage all notifications'
  ) THEN
    CREATE POLICY "Admins can manage all notifications"
      ON notifications FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
