/*
  # Fix Infinite Recursion in Order Policies

  ## Purpose
  Remove circular dependency between orders and order_items policies

  ## Changes
  1. Drop the problematic recursive policy
  2. Keep only the direct supplier order items policy
  3. Suppliers will access orders through order_items relationship

  ## Security
  - Suppliers can view their order items directly
  - Orders accessed through order_items won't cause recursion
*/

-- Drop the recursive policy that causes infinite recursion
DROP POLICY IF EXISTS "Suppliers can view orders with their products" ON orders;

-- The "Suppliers can view their order items" policy is fine as it doesn't cause recursion
-- Users can still view their own orders through the existing policy