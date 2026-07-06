-- Add origin_country_id to products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS origin_country_id uuid REFERENCES countries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_origin_country_id ON products(origin_country_id);
