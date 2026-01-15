/*
  # Fix Product Visibility Policies

  ## Purpose
  Update RLS policies to allow public viewing of products and categories so they display in the app.

  ## Changes
  1. Allow anon users to view active products
  2. Allow anon users to view active categories
  3. Allow anon users to view product images

  ## Security
  - Still restricts modifications to authenticated users only
  - Only allows viewing of active products/categories
*/

-- Update products policy to allow anon access
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Update product_images policy to allow anon access
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
      AND products.is_active = true
    )
  );

-- Update categories policy to allow anon access
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);