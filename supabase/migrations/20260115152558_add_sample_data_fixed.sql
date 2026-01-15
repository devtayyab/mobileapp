/*
  # Add Sample Data

  ## Purpose
  Populate the database with sample categories and products for demonstration purposes.

  ## Changes
  1. Creates sample categories (Clothing, Accessories, Lifestyle)
  2. Creates a demo supplier
  3. Creates sample products in each category

  ## Notes
  - All sample data can be safely removed in production
  - Products have realistic pricing for both B2C and B2B customers
*/

DO $$
DECLARE
  demo_supplier_id uuid;
  clothing_category_id uuid;
  accessories_category_id uuid;
  lifestyle_category_id uuid;
BEGIN
  -- Insert demo supplier
  INSERT INTO suppliers (id, business_name, kyc_status, commission_rate, is_active)
  VALUES (gen_random_uuid(), 'Demo Fashion Supplier', 'approved', 10.00, true)
  RETURNING id INTO demo_supplier_id;

  -- Insert Clothing category
  INSERT INTO categories (id, name, slug, description, is_active, display_order)
  VALUES (gen_random_uuid(), 'Clothing', 'clothing', 'Fashion clothing and apparel', true, 1)
  RETURNING id INTO clothing_category_id;

  -- Insert Accessories category
  INSERT INTO categories (id, name, slug, description, is_active, display_order)
  VALUES (gen_random_uuid(), 'Accessories', 'accessories', 'Fashion accessories and jewelry', true, 2)
  RETURNING id INTO accessories_category_id;

  -- Insert Lifestyle category
  INSERT INTO categories (id, name, slug, description, is_active, display_order)
  VALUES (gen_random_uuid(), 'Lifestyle', 'lifestyle', 'Lifestyle and home products', true, 3)
  RETURNING id INTO lifestyle_category_id;

  -- Insert sample products for Clothing
  INSERT INTO products (supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (demo_supplier_id, clothing_category_id, 'Classic Cotton T-Shirt', 'classic-cotton-tshirt', 'Comfortable cotton t-shirt for everyday wear', 'CLT-001', 29.99, 19.99, 'USD', 150, true, true),
    (demo_supplier_id, clothing_category_id, 'Denim Jeans', 'denim-jeans', 'High-quality denim jeans with perfect fit', 'CLT-002', 79.99, 54.99, 'USD', 100, true, true),
    (demo_supplier_id, clothing_category_id, 'Casual Hoodie', 'casual-hoodie', 'Warm and stylish hoodie for casual wear', 'CLT-003', 49.99, 34.99, 'USD', 80, true, false),
    (demo_supplier_id, clothing_category_id, 'Summer Dress', 'summer-dress', 'Elegant summer dress for any occasion', 'CLT-004', 89.99, 62.99, 'USD', 60, true, true);

  -- Insert sample products for Accessories
  INSERT INTO products (supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (demo_supplier_id, accessories_category_id, 'Leather Wallet', 'leather-wallet', 'Premium leather wallet with multiple compartments', 'ACC-001', 39.99, 27.99, 'USD', 200, true, true),
    (demo_supplier_id, accessories_category_id, 'Sunglasses', 'sunglasses', 'Stylish UV protection sunglasses', 'ACC-002', 59.99, 41.99, 'USD', 120, true, false),
    (demo_supplier_id, accessories_category_id, 'Leather Belt', 'leather-belt', 'Classic leather belt for formal and casual wear', 'ACC-003', 34.99, 24.49, 'USD', 150, true, true);

  -- Insert sample products for Lifestyle
  INSERT INTO products (supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (demo_supplier_id, lifestyle_category_id, 'Ceramic Mug', 'ceramic-mug', 'Handcrafted ceramic mug for coffee and tea', 'LIF-001', 19.99, 13.99, 'USD', 250, true, false),
    (demo_supplier_id, lifestyle_category_id, 'Scented Candle', 'scented-candle', 'Relaxing scented candle for home ambiance', 'LIF-002', 24.99, 17.49, 'USD', 180, true, true),
    (demo_supplier_id, lifestyle_category_id, 'Yoga Mat', 'yoga-mat', 'Non-slip yoga mat for fitness enthusiasts', 'LIF-003', 44.99, 31.49, 'USD', 90, true, false);

END $$;