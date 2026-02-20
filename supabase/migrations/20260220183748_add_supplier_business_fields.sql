/*
  # Add Business Fields to Suppliers Table

  1. Changes
    - Add `business_description` (text) - optional description of the business
    - Add `business_email` (text) - business contact email
    - Add `business_phone` (text) - business contact phone
    - Add `business_address` (text) - full business address as text
    - Add `website` (text) - business website URL

  2. Notes
    - All columns are nullable (optional)
    - No data loss; purely additive migration
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'business_description'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN business_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'business_email'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN business_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'business_phone'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN business_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'business_address'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN business_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'website'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN website text;
  END IF;
END $$;
