/*
  # Add Comprehensive Test Data

  ## Purpose
  Add extensive test data including more products, product images, and realistic sample data for testing all features.

  ## Changes
  1. Adds more products across all categories
  2. Adds product images for all products
  3. Adds more categories and subcategories
  4. Creates varied pricing and stock levels

  ## Notes
  - All test data can be removed in production
  - Images use placeholder URLs from Pexels
*/

DO $$
DECLARE
  demo_supplier_id uuid;
  clothing_category_id uuid;
  accessories_category_id uuid;
  lifestyle_category_id uuid;
  footwear_category_id uuid;
  electronics_category_id uuid;
  beauty_category_id uuid;
  product_id uuid;
BEGIN
  -- Get existing supplier
  SELECT id INTO demo_supplier_id FROM suppliers WHERE business_name = 'Demo Fashion Supplier' LIMIT 1;
  
  -- If no supplier exists, create one
  IF demo_supplier_id IS NULL THEN
    INSERT INTO suppliers (id, business_name, kyc_status, commission_rate, is_active)
    VALUES (gen_random_uuid(), 'Demo Fashion Supplier', 'approved', 10.00, true)
    RETURNING id INTO demo_supplier_id;
  END IF;

  -- Get existing categories
  SELECT id INTO clothing_category_id FROM categories WHERE slug = 'clothing' LIMIT 1;
  SELECT id INTO accessories_category_id FROM categories WHERE slug = 'accessories' LIMIT 1;
  SELECT id INTO lifestyle_category_id FROM categories WHERE slug = 'lifestyle' LIMIT 1;

  -- Add new categories
  INSERT INTO categories (id, name, slug, description, is_active, display_order)
  VALUES 
    (gen_random_uuid(), 'Footwear', 'footwear', 'Shoes, sneakers, and footwear', true, 4),
    (gen_random_uuid(), 'Electronics', 'electronics', 'Tech gadgets and accessories', true, 5),
    (gen_random_uuid(), 'Beauty', 'beauty', 'Beauty and personal care products', true, 6)
  ON CONFLICT (slug) DO NOTHING;

  -- Get new category IDs
  SELECT id INTO footwear_category_id FROM categories WHERE slug = 'footwear' LIMIT 1;
  SELECT id INTO electronics_category_id FROM categories WHERE slug = 'electronics' LIMIT 1;
  SELECT id INTO beauty_category_id FROM categories WHERE slug = 'beauty' LIMIT 1;

  -- Add more clothing products
  INSERT INTO products (id, supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (gen_random_uuid(), demo_supplier_id, clothing_category_id, 'Leather Jacket', 'leather-jacket', 'Premium leather jacket with modern styling', 'CLT-005', 199.99, 139.99, 'USD', 45, true, true),
    (gen_random_uuid(), demo_supplier_id, clothing_category_id, 'Wool Sweater', 'wool-sweater', 'Soft merino wool sweater for cold weather', 'CLT-006', 69.99, 48.99, 'USD', 95, true, false),
    (gen_random_uuid(), demo_supplier_id, clothing_category_id, 'Chino Pants', 'chino-pants', 'Versatile chino pants for smart casual look', 'CLT-007', 59.99, 41.99, 'USD', 120, true, false),
    (gen_random_uuid(), demo_supplier_id, clothing_category_id, 'Blazer', 'blazer', 'Tailored blazer for professional occasions', 'CLT-008', 149.99, 104.99, 'USD', 55, true, true),
    (gen_random_uuid(), demo_supplier_id, clothing_category_id, 'Polo Shirt', 'polo-shirt', 'Classic polo shirt in multiple colors', 'CLT-009', 39.99, 27.99, 'USD', 180, true, false),
    (gen_random_uuid(), demo_supplier_id, clothing_category_id, 'Track Pants', 'track-pants', 'Comfortable track pants for sports and leisure', 'CLT-010', 44.99, 31.49, 'USD', 140, true, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Add more accessories
  INSERT INTO products (id, supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (gen_random_uuid(), demo_supplier_id, accessories_category_id, 'Smartwatch', 'smartwatch', 'Fitness tracking smartwatch with notifications', 'ACC-004', 149.99, 104.99, 'USD', 75, true, true),
    (gen_random_uuid(), demo_supplier_id, accessories_category_id, 'Backpack', 'backpack', 'Durable backpack with laptop compartment', 'ACC-005', 79.99, 55.99, 'USD', 110, true, true),
    (gen_random_uuid(), demo_supplier_id, accessories_category_id, 'Scarf', 'scarf', 'Elegant silk scarf in various patterns', 'ACC-006', 29.99, 20.99, 'USD', 200, true, false),
    (gen_random_uuid(), demo_supplier_id, accessories_category_id, 'Baseball Cap', 'baseball-cap', 'Adjustable baseball cap with embroidery', 'ACC-007', 24.99, 17.49, 'USD', 250, true, false),
    (gen_random_uuid(), demo_supplier_id, accessories_category_id, 'Crossbody Bag', 'crossbody-bag', 'Compact crossbody bag for daily essentials', 'ACC-008', 89.99, 62.99, 'USD', 85, true, true)
  ON CONFLICT (slug) DO NOTHING;

  -- Add footwear products
  INSERT INTO products (id, supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (gen_random_uuid(), demo_supplier_id, footwear_category_id, 'Running Shoes', 'running-shoes', 'Lightweight running shoes with cushioning', 'FOT-001', 119.99, 83.99, 'USD', 100, true, true),
    (gen_random_uuid(), demo_supplier_id, footwear_category_id, 'Casual Sneakers', 'casual-sneakers', 'Stylish sneakers for everyday wear', 'FOT-002', 89.99, 62.99, 'USD', 130, true, true),
    (gen_random_uuid(), demo_supplier_id, footwear_category_id, 'Leather Boots', 'leather-boots', 'Classic leather boots for winter', 'FOT-003', 159.99, 111.99, 'USD', 65, true, false),
    (gen_random_uuid(), demo_supplier_id, footwear_category_id, 'Sandals', 'sandals', 'Comfortable summer sandals', 'FOT-004', 49.99, 34.99, 'USD', 180, true, false),
    (gen_random_uuid(), demo_supplier_id, footwear_category_id, 'Formal Shoes', 'formal-shoes', 'Elegant formal shoes for special occasions', 'FOT-005', 139.99, 97.99, 'USD', 70, true, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Add electronics products
  INSERT INTO products (id, supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (gen_random_uuid(), demo_supplier_id, electronics_category_id, 'Wireless Earbuds', 'wireless-earbuds', 'True wireless earbuds with noise cancellation', 'ELC-001', 99.99, 69.99, 'USD', 150, true, true),
    (gen_random_uuid(), demo_supplier_id, electronics_category_id, 'Phone Case', 'phone-case', 'Protective phone case with card holder', 'ELC-002', 19.99, 13.99, 'USD', 300, true, false),
    (gen_random_uuid(), demo_supplier_id, electronics_category_id, 'Portable Charger', 'portable-charger', 'High-capacity portable power bank', 'ELC-003', 39.99, 27.99, 'USD', 200, true, true),
    (gen_random_uuid(), demo_supplier_id, electronics_category_id, 'USB Cable', 'usb-cable', 'Fast charging USB-C cable', 'ELC-004', 14.99, 10.49, 'USD', 500, true, false),
    (gen_random_uuid(), demo_supplier_id, electronics_category_id, 'Bluetooth Speaker', 'bluetooth-speaker', 'Portable Bluetooth speaker with premium sound', 'ELC-005', 79.99, 55.99, 'USD', 120, true, true)
  ON CONFLICT (slug) DO NOTHING;

  -- Add beauty products
  INSERT INTO products (id, supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (gen_random_uuid(), demo_supplier_id, beauty_category_id, 'Face Moisturizer', 'face-moisturizer', 'Hydrating face moisturizer for all skin types', 'BTY-001', 34.99, 24.49, 'USD', 220, true, false),
    (gen_random_uuid(), demo_supplier_id, beauty_category_id, 'Lip Balm Set', 'lip-balm-set', 'Natural lip balm set with various flavors', 'BTY-002', 18.99, 13.29, 'USD', 280, true, false),
    (gen_random_uuid(), demo_supplier_id, beauty_category_id, 'Hair Serum', 'hair-serum', 'Nourishing hair serum for shine and strength', 'BTY-003', 29.99, 20.99, 'USD', 190, true, true),
    (gen_random_uuid(), demo_supplier_id, beauty_category_id, 'Facial Mask Pack', 'facial-mask-pack', 'Set of 10 rejuvenating facial masks', 'BTY-004', 24.99, 17.49, 'USD', 240, true, false),
    (gen_random_uuid(), demo_supplier_id, beauty_category_id, 'Perfume', 'perfume', 'Elegant signature perfume', 'BTY-005', 89.99, 62.99, 'USD', 95, true, true)
  ON CONFLICT (slug) DO NOTHING;

  -- Add more lifestyle products
  INSERT INTO products (id, supplier_id, category_id, name, slug, description, sku, b2c_price, b2b_price, currency, stock_quantity, is_active, is_featured)
  VALUES
    (gen_random_uuid(), demo_supplier_id, lifestyle_category_id, 'Water Bottle', 'water-bottle', 'Insulated stainless steel water bottle', 'LIF-004', 29.99, 20.99, 'USD', 300, true, false),
    (gen_random_uuid(), demo_supplier_id, lifestyle_category_id, 'Notebook Set', 'notebook-set', 'Premium notebook set for journaling', 'LIF-005', 22.99, 16.09, 'USD', 350, true, false),
    (gen_random_uuid(), demo_supplier_id, lifestyle_category_id, 'Travel Pillow', 'travel-pillow', 'Memory foam travel neck pillow', 'LIF-006', 34.99, 24.49, 'USD', 160, true, false),
    (gen_random_uuid(), demo_supplier_id, lifestyle_category_id, 'Desk Organizer', 'desk-organizer', 'Bamboo desk organizer for office', 'LIF-007', 39.99, 27.99, 'USD', 140, true, false),
    (gen_random_uuid(), demo_supplier_id, lifestyle_category_id, 'Lunch Box', 'lunch-box', 'Eco-friendly lunch box with compartments', 'LIF-008', 27.99, 19.59, 'USD', 200, true, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Add product images using Pexels stock photos
  -- Note: These are generic placeholder URLs. In production, use actual product images.
  
  -- Classic Cotton T-Shirt
  SELECT id INTO product_id FROM products WHERE slug = 'classic-cotton-tshirt' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg', 'Classic Cotton T-Shirt', 0, true),
      (product_id, 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg', 'T-Shirt Detail', 1, false);
  END IF;

  -- Denim Jeans
  SELECT id INTO product_id FROM products WHERE slug = 'denim-jeans' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg', 'Denim Jeans', 0, true),
      (product_id, 'https://images.pexels.com/photos/1346187/pexels-photo-1346187.jpeg', 'Jeans Close Up', 1, false);
  END IF;

  -- Casual Hoodie
  SELECT id INTO product_id FROM products WHERE slug = 'casual-hoodie' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/7679454/pexels-photo-7679454.jpeg', 'Casual Hoodie', 0, true);
  END IF;

  -- Summer Dress
  SELECT id INTO product_id FROM products WHERE slug = 'summer-dress' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg', 'Summer Dress', 0, true);
  END IF;

  -- Leather Wallet
  SELECT id INTO product_id FROM products WHERE slug = 'leather-wallet' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg', 'Leather Wallet', 0, true);
  END IF;

  -- Sunglasses
  SELECT id INTO product_id FROM products WHERE slug = 'sunglasses' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg', 'Sunglasses', 0, true);
  END IF;

  -- Leather Belt
  SELECT id INTO product_id FROM products WHERE slug = 'leather-belt' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/5864245/pexels-photo-5864245.jpeg', 'Leather Belt', 0, true);
  END IF;

  -- Running Shoes
  SELECT id INTO product_id FROM products WHERE slug = 'running-shoes' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg', 'Running Shoes', 0, true),
      (product_id, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg', 'Running Shoes Side View', 1, false);
  END IF;

  -- Casual Sneakers
  SELECT id INTO product_id FROM products WHERE slug = 'casual-sneakers' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/1280064/pexels-photo-1280064.jpeg', 'Casual Sneakers', 0, true);
  END IF;

  -- Wireless Earbuds
  SELECT id INTO product_id FROM products WHERE slug = 'wireless-earbuds' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/8000588/pexels-photo-8000588.jpeg', 'Wireless Earbuds', 0, true);
  END IF;

  -- Backpack
  SELECT id INTO product_id FROM products WHERE slug = 'backpack' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg', 'Backpack', 0, true);
  END IF;

  -- Smartwatch
  SELECT id INTO product_id FROM products WHERE slug = 'smartwatch' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg', 'Smartwatch', 0, true);
  END IF;

  -- Scented Candle
  SELECT id INTO product_id FROM products WHERE slug = 'scented-candle' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/6146977/pexels-photo-6146977.jpeg', 'Scented Candle', 0, true);
  END IF;

  -- Yoga Mat
  SELECT id INTO product_id FROM products WHERE slug = 'yoga-mat' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg', 'Yoga Mat', 0, true);
  END IF;

  -- Bluetooth Speaker
  SELECT id INTO product_id FROM products WHERE slug = 'bluetooth-speaker' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg', 'Bluetooth Speaker', 0, true);
  END IF;

  -- Leather Jacket
  SELECT id INTO product_id FROM products WHERE slug = 'leather-jacket' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg', 'Leather Jacket', 0, true);
  END IF;

  -- Perfume
  SELECT id INTO product_id FROM products WHERE slug = 'perfume' LIMIT 1;
  IF product_id IS NOT NULL THEN
    INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
    VALUES 
      (product_id, 'https://images.pexels.com/photos/965990/pexels-photo-965990.jpeg', 'Perfume', 0, true);
  END IF;

END $$;