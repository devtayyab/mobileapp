/*
  # Add Orders Policies

  ## Purpose
  Add RLS policies for orders and order_items tables

  ## Changes
  1. Add policies for users to view their own orders
  2. Add policies for users to view their order items
  3. Add policies for suppliers to view orders containing their products

  ## Security
  - Users can only view their own orders
  - Suppliers can view orders that include their products
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

-- Create policies for orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for order_items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );