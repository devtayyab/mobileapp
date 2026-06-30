CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON product_reviews;
CREATE POLICY "Anyone can view approved reviews"
  ON product_reviews FOR SELECT
  TO public
  USING (is_approved = true);

-- Users can insert their own reviews
DROP POLICY IF EXISTS "Users can insert own reviews" ON product_reviews;
CREATE POLICY "Users can insert own reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON product_reviews;
CREATE POLICY "Users can delete own reviews"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all reviews
DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;
CREATE POLICY "Admins can manage all reviews"
  ON product_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
