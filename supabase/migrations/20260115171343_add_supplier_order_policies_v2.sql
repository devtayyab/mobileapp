/*
  # Add Supplier Order Policies

  ## Purpose
  Allow suppliers to view orders and order items for products they supply

  ## Changes
  1. Add policies for suppliers to view order items for their products
  2. Add policies for suppliers to view orders containing their products

  ## Security
  - Suppliers can only view orders containing their products
  - Check is done via supplier_id on order_items
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Suppliers can view their order items" ON order_items;
DROP POLICY IF EXISTS "Suppliers can view orders with their products" ON orders;

-- Create policy for suppliers to view their order items
CREATE POLICY "Suppliers can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = order_items.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Create policy for suppliers to view orders containing their products
CREATE POLICY "Suppliers can view orders with their products"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN suppliers ON suppliers.id = order_items.supplier_id
      WHERE order_items.order_id = orders.id
      AND suppliers.user_id = auth.uid()
    )
  );