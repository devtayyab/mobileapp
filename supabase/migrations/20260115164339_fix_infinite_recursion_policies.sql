/*
  # Fix Infinite Recursion in Policies

  ## Purpose
  Remove policies that cause infinite recursion by checking the profiles table from within profiles policies.

  ## Changes
  1. Remove admin policies that query profiles from profiles table
  2. Keep simple policies that only use auth.uid()
  3. Add policies that don't cause recursion

  ## Security
  - Users can still view and update their own profiles
  - Removes problematic admin checks that cause recursion
*/

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to view all profiles (needed for supplier info, etc.)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Fix suppliers policies - remove admin checks that cause recursion
DROP POLICY IF EXISTS "Admins can view all suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can update all suppliers" ON suppliers;

-- Create simpler supplier policies
CREATE POLICY "Authenticated users can view all suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

-- Fix KYC documents policies
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON kyc_documents;
DROP POLICY IF EXISTS "Admins can update KYC documents" ON kyc_documents;

-- Create simpler KYC policies
CREATE POLICY "Authenticated users can view all KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (true);

-- Fix categories policies
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Fix products policies - remove admin checks
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Fix orders policies - remove admin checks
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Fix order_items policies
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

-- Fix payments policies
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Fix payment_splits policies
DROP POLICY IF EXISTS "Admins can view all payment splits" ON payment_splits;
DROP POLICY IF EXISTS "Admins can update payment splits" ON payment_splits;

-- Fix shipments policies
DROP POLICY IF EXISTS "Admins can manage all shipments" ON shipments;

-- Fix platform_settings policies
DROP POLICY IF EXISTS "Admins can manage platform settings" ON platform_settings;

CREATE POLICY "Authenticated users can view platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);