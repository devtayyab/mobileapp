-- Allow suppliers to create categories
CREATE POLICY "Suppliers can create categories"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers 
      WHERE user_id = auth.uid()
    )
  );
