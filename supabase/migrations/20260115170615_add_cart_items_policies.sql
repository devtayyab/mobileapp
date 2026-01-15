/*
  # Add Cart Items Policies

  ## Purpose
  Add RLS policies for cart_items table to allow users to manage their cart

  ## Changes
  1. Add policies for users to view their own cart items
  2. Add policies for users to insert items to their cart
  3. Add policies for users to update their cart items
  4. Add policies for users to delete their cart items

  ## Security
  - Users can only access their own cart items
  - All operations check auth.uid() matches user_id
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

-- Create policies for cart_items
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);