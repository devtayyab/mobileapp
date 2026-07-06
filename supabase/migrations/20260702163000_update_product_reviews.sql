-- Change default to false for new reviews
ALTER TABLE product_reviews ALTER COLUMN is_approved SET DEFAULT false;

-- Allow suppliers to view reviews of their own products
DROP POLICY IF EXISTS "Suppliers can view own product reviews" ON product_reviews;
CREATE POLICY "Suppliers can view own product reviews"
  ON product_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN suppliers ON suppliers.id = products.supplier_id
      WHERE products.id = product_reviews.product_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Allow suppliers to update reviews of their own products (for approval)
DROP POLICY IF EXISTS "Suppliers can update own product reviews" ON product_reviews;
CREATE POLICY "Suppliers can update own product reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN suppliers ON suppliers.id = products.supplier_id
      WHERE products.id = product_reviews.product_id
      AND suppliers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN suppliers ON suppliers.id = products.supplier_id
      WHERE products.id = product_reviews.product_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Allow suppliers to delete reviews of their own products
DROP POLICY IF EXISTS "Suppliers can delete own product reviews" ON product_reviews;
CREATE POLICY "Suppliers can delete own product reviews"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN suppliers ON suppliers.id = products.supplier_id
      WHERE products.id = product_reviews.product_id
      AND suppliers.user_id = auth.uid()
    )
  );
