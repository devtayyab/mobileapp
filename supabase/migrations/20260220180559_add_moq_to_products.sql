/*
  # Add MOQ (Minimum Order Quantity) to products

  1. Changes
    - Adds `moq` column to `products` table with default value of 1
    - MOQ is used for wholesale/B2B customers to set minimum purchase quantities

  2. Notes
    - Default is 1 (no minimum restriction)
    - Only visible/enforced for B2B customers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'moq'
  ) THEN
    ALTER TABLE products ADD COLUMN moq integer NOT NULL DEFAULT 1;
  END IF;
END $$;
