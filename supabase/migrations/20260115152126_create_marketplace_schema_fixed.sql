/*
  # Marketplace Platform Database Schema

  ## Overview
  Complete database schema for a multi-vendor dropshipping marketplace platform with automated payment splitting, KYC verification, and multi-role support.

  ## Tables Created

  ### 1. profiles
  Extended user profile with role-based access (customer, b2b, supplier, admin)
  - Links to auth.users
  - Stores user type, contact info, and preferences

  ### 2. suppliers
  Vendor/supplier business information
  - Business details and registration
  - KYC verification status
  - Commission rates and payout settings
  - Auto-payout preferences

  ### 3. kyc_documents
  KYC verification documents for suppliers
  - Business registration, identity verification
  - Document upload tracking
  - Approval workflow

  ### 4. categories
  Product categories with hierarchical structure
  - Support for parent-child relationships
  - Multi-level categorization

  ### 5. products
  Product catalog with supplier management
  - Multi-vendor product listings
  - Stock management
  - B2C and B2B pricing
  - Auto-sync capability

  ### 6. product_images
  Product image gallery
  - Multiple images per product
  - Display order management

  ### 7. carts
  Shopping cart management
  - Persistent cart storage
  - User-specific carts

  ### 8. cart_items
  Individual cart items
  - Quantity and pricing tracking
  - Customer type-based pricing

  ### 9. orders
  Order management and tracking
  - Multi-status workflow
  - Payment and shipment tracking
  - Commission calculation

  ### 10. order_items
  Individual order line items
  - Product details snapshot
  - Supplier allocation

  ### 11. payments
  Payment transaction records
  - Gateway integration tracking
  - Payment status management

  ### 12. payment_splits
  Automated payment distribution
  - Platform commission tracking
  - Supplier payout management

  ### 13. shipments
  Order shipment and tracking
  - Tracking numbers
  - Status updates
  - Delivery management

  ### 14. platform_settings
  Global platform configuration
  - Commission rates
  - Country and currency settings
  - Feature flags

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies based on user roles and ownership
  - Secure access patterns for all user types
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'b2b', 'supplier', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role user_role DEFAULT 'customer',
  company_name text,
  tax_id text,
  address jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_registration_number text,
  business_type text,
  kyc_status kyc_status DEFAULT 'pending',
  kyc_submitted_at timestamptz,
  kyc_approved_at timestamptz,
  kyc_rejected_reason text,
  commission_rate decimal(5,2) DEFAULT 10.00,
  bank_account_details jsonb DEFAULT '{}',
  auto_payout_enabled boolean DEFAULT false,
  payout_threshold decimal(10,2) DEFAULT 100.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers can view own data" ON suppliers;
CREATE POLICY "Suppliers can view own data"
  ON suppliers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers can update own data" ON suppliers;
CREATE POLICY "Suppliers can update own data"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all suppliers" ON suppliers;
CREATE POLICY "Admins can view all suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all suppliers" ON suppliers;
CREATE POLICY "Admins can update all suppliers"
  ON suppliers FOR UPDATE
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

-- 3. KYC Documents
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text NOT NULL,
  document_number text,
  status kyc_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers can view own KYC documents" ON kyc_documents;
CREATE POLICY "Suppliers can view own KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = kyc_documents.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Suppliers can insert own KYC documents" ON kyc_documents;
CREATE POLICY "Suppliers can insert own KYC documents"
  ON kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all KYC documents" ON kyc_documents;
CREATE POLICY "Admins can view all KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update KYC documents" ON kyc_documents;
CREATE POLICY "Admins can update KYC documents"
  ON kyc_documents FOR UPDATE
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

-- 4. Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
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

-- 5. Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  specifications jsonb DEFAULT '{}',
  sku text,
  barcode text,
  b2c_price decimal(10,2) NOT NULL,
  b2b_price decimal(10,2),
  cost_price decimal(10,2),
  currency text DEFAULT 'USD',
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  auto_sync_enabled boolean DEFAULT false,
  external_product_id text,
  weight decimal(10,2),
  dimensions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Suppliers can view own products" ON products;
CREATE POLICY "Suppliers can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = products.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Suppliers can manage own products" ON products;
CREATE POLICY "Suppliers can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = products.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = products.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all products" ON products;
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
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

-- 6. Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
      AND products.is_active = true
    )
  );

DROP POLICY IF EXISTS "Suppliers can manage own product images" ON product_images;
CREATE POLICY "Suppliers can manage own product images"
  ON product_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN suppliers ON suppliers.id = products.supplier_id
      WHERE products.id = product_images.product_id
      AND suppliers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN suppliers ON suppliers.id = products.supplier_id
      WHERE products.id = product_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- 7. Carts
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cart" ON carts;
CREATE POLICY "Users can view own cart"
  ON carts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own cart" ON carts;
CREATE POLICY "Users can manage own cart"
  ON carts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;
CREATE POLICY "Users can manage own cart items"
  ON cart_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- 9. Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  subtotal decimal(10,2) NOT NULL,
  tax decimal(10,2) DEFAULT 0,
  shipping_fee decimal(10,2) DEFAULT 0,
  platform_commission decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
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

-- 10. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  supplier_amount decimal(10,2) NOT NULL,
  platform_commission decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Suppliers can view own order items" ON order_items;
CREATE POLICY "Suppliers can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = order_items.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Now add the policy that references order_items
DROP POLICY IF EXISTS "Suppliers can view orders with their products" ON orders;
CREATE POLICY "Suppliers can view orders with their products"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN products ON products.id = order_items.product_id
      JOIN suppliers ON suppliers.id = products.supplier_id
      WHERE order_items.order_id = orders.id
      AND suppliers.user_id = auth.uid()
    )
  );

-- 11. Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  payment_gateway text NOT NULL,
  transaction_id text,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status payment_status DEFAULT 'pending',
  payment_method text,
  payment_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Suppliers can view payments for their orders" ON payments;
CREATE POLICY "Suppliers can view payments for their orders"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN suppliers ON suppliers.id = order_items.supplier_id
      WHERE order_items.order_id = payments.order_id
      AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 12. Payment Splits
CREATE TABLE IF NOT EXISTS payment_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  split_type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  status payment_status DEFAULT 'pending',
  payout_reference text,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers can view own payment splits" ON payment_splits;
CREATE POLICY "Suppliers can view own payment splits"
  ON payment_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = payment_splits.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all payment splits" ON payment_splits;
CREATE POLICY "Admins can view all payment splits"
  ON payment_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update payment splits" ON payment_splits;
CREATE POLICY "Admins can update payment splits"
  ON payment_splits FOR UPDATE
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

-- 13. Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  tracking_number text,
  carrier text,
  status shipment_status DEFAULT 'pending',
  shipped_at timestamptz,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  tracking_updates jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shipments" ON shipments;
CREATE POLICY "Users can view own shipments"
  ON shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipments.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Suppliers can manage own shipments" ON shipments;
CREATE POLICY "Suppliers can manage own shipments"
  ON shipments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = shipments.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all shipments" ON shipments;
CREATE POLICY "Admins can manage all shipments"
  ON shipments FOR ALL
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

-- 14. Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage platform settings" ON platform_settings;
CREATE POLICY "Admins can manage platform settings"
  ON platform_settings FOR ALL
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_kyc_status ON suppliers(kyc_status);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_supplier_id ON order_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_supplier_id ON payment_splits(supplier_id);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('default_commission_rate', '{"rate": 10.0}', 'Default platform commission rate percentage'),
  ('supported_currencies', '{"currencies": ["USD", "EUR", "GBP"]}', 'List of supported currencies'),
  ('supported_countries', '{"countries": ["US", "UK", "EU"]}', 'List of supported countries'),
  ('minimum_payout_threshold', '{"amount": 100.0}', 'Minimum balance for supplier payout')
ON CONFLICT (key) DO NOTHING;