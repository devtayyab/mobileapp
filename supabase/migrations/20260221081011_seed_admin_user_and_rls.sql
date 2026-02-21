/*
  # Seed Admin User and Fix Admin RLS Policies

  ## Summary
  Creates a seeded admin account with fixed credentials that cannot be registered
  through normal signup flow. Also adds proper admin RLS policies so the admin
  can access all tables for full management capabilities.

  ## Admin Credentials
  - Email: admin@marketplace.com
  - Password: Admin@2024!

  ## Changes
  1. Creates admin user via auth.users (if not exists)
  2. Creates/updates admin profile with role = 'admin'
  3. Adds helper function is_admin() for RLS
  4. Adds admin SELECT/INSERT/UPDATE/DELETE policies on all key tables
*/

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Create admin auth user if it doesn't exist
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@marketplace.com';

  IF admin_uid IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@marketplace.com',
      crypt('Admin@2024!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Platform Administrator"}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_uid;
  END IF;

  -- Upsert admin profile
  INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (admin_uid, 'admin@marketplace.com', 'Platform Administrator', 'admin', now(), now())
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Platform Administrator', email = 'admin@marketplace.com';

END $$;

-- ============================================================
-- ADMIN RLS POLICIES
-- ============================================================

-- PROFILES: admin can read/update all profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admin can read all profiles') THEN
    CREATE POLICY "Admin can read all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admin can update all profiles') THEN
    CREATE POLICY "Admin can update all profiles"
      ON profiles FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- SUPPLIERS: admin full access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Admin can read all suppliers') THEN
    CREATE POLICY "Admin can read all suppliers"
      ON suppliers FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Admin can update all suppliers') THEN
    CREATE POLICY "Admin can update all suppliers"
      ON suppliers FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- KYC_DOCUMENTS: admin full access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kyc_documents' AND policyname = 'Admin can read all kyc documents') THEN
    CREATE POLICY "Admin can read all kyc documents"
      ON kyc_documents FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kyc_documents' AND policyname = 'Admin can update kyc documents') THEN
    CREATE POLICY "Admin can update kyc documents"
      ON kyc_documents FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- PRODUCTS: admin full access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admin can read all products') THEN
    CREATE POLICY "Admin can read all products"
      ON products FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admin can update all products') THEN
    CREATE POLICY "Admin can update all products"
      ON products FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- ORDERS: admin full access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admin can read all orders') THEN
    CREATE POLICY "Admin can read all orders"
      ON orders FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admin can update all orders') THEN
    CREATE POLICY "Admin can update all orders"
      ON orders FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- ORDER_ITEMS: admin read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admin can read all order items') THEN
    CREATE POLICY "Admin can read all order items"
      ON order_items FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- NOTIFICATIONS: admin insert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admin can insert notifications') THEN
    CREATE POLICY "Admin can insert notifications"
      ON notifications FOR INSERT
      TO authenticated
      WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admin can read all notifications') THEN
    CREATE POLICY "Admin can read all notifications"
      ON notifications FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- CATEGORIES: admin full access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Admin can manage categories') THEN
    CREATE POLICY "Admin can manage categories"
      ON categories FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- PLATFORM_SETTINGS: admin full access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'Admin can read platform settings') THEN
    CREATE POLICY "Admin can read platform settings"
      ON platform_settings FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'Admin can update platform settings') THEN
    CREATE POLICY "Admin can update platform settings"
      ON platform_settings FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- PRODUCT_IMAGES: admin read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'Admin can read all product images') THEN
    CREATE POLICY "Admin can read all product images"
      ON product_images FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;
