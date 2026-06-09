-- Add shipping_cost to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost decimal(10,2) DEFAULT 0;
