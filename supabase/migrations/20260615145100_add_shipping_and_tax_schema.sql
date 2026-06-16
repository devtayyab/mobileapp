-- Migration to add Shipping, VAT, and Tracking tables and columns

-- 1. Countries
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  vat_percentage decimal(5,2) DEFAULT 0,
  vat_type text DEFAULT 'excluded', -- 'included' or 'excluded'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active countries" ON countries;
CREATE POLICY "Anyone can view active countries"
  ON countries FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage countries" ON countries;
CREATE POLICY "Admins can manage countries"
  ON countries FOR ALL
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

-- 2. Couriers
CREATE TABLE IF NOT EXISTS couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  tracking_url_format text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active couriers" ON couriers;
CREATE POLICY "Anyone can view active couriers"
  ON couriers FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage couriers" ON couriers;
CREATE POLICY "Admins can manage couriers"
  ON couriers FOR ALL
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

-- 3. Supplier Shipping Rates
CREATE TABLE IF NOT EXISTS supplier_shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id) ON DELETE CASCADE,
  shipping_charge decimal(10,2) NOT NULL DEFAULT 0,
  delivery_time_days integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(supplier_id, country_id)
);

ALTER TABLE supplier_shipping_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active shipping rates" ON supplier_shipping_rates;
CREATE POLICY "Anyone can view active shipping rates"
  ON supplier_shipping_rates FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Suppliers can manage own shipping rates" ON supplier_shipping_rates;
CREATE POLICY "Suppliers can manage own shipping rates"
  ON supplier_shipping_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_shipping_rates.supplier_id
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

-- 4. Alter existing tables
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS shipping_country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vat_amount decimal(10,2) DEFAULT 0;

ALTER TABLE shipments 
  ADD COLUMN IF NOT EXISTS courier_id uuid REFERENCES couriers(id) ON DELETE SET NULL;

-- 5. Seed Initial Data
INSERT INTO countries (name, code, vat_percentage, vat_type, is_active) VALUES
  ('United States', 'US', 0, 'excluded', true),
  ('United Kingdom', 'GB', 20, 'included', true),
  ('Germany', 'DE', 19, 'included', true),
  ('France', 'FR', 20, 'included', true),
  ('Italy', 'IT', 22, 'included', true),
  ('Spain', 'ES', 21, 'included', true),
  ('Australia', 'AU', 10, 'included', true),
  ('United Arab Emirates', 'AE', 5, 'excluded', true),
  ('Saudi Arabia', 'SA', 15, 'included', true),
  ('India', 'IN', 18, 'excluded', true),
  ('Nepal', 'NP', 13, 'included', true),
  ('Japan', 'JP', 10, 'included', true),
  ('South Korea', 'KR', 10, 'included', true),
  ('Singapore', 'SG', 9, 'included', true),
  ('Malaysia', 'MY', 6, 'included', true),
  ('Thailand', 'TH', 7, 'included', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, vat_percentage = EXCLUDED.vat_percentage, vat_type = EXCLUDED.vat_type;

INSERT INTO couriers (name, code, tracking_url_format, is_active) VALUES
  ('DHL', 'DHL', 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}', true),
  ('FedEx', 'FEDEX', 'https://www.fedex.com/fedextrack/?tracknumbers={tracking_number}', true),
  ('UPS', 'UPS', 'https://www.ups.com/track?tracknum={tracking_number}', true),
  ('Aramex', 'ARAMEX', 'https://www.aramex.com/us/en/track/track-results-new?ShipmentNumber={tracking_number}', true),
  ('EMS', 'EMS', 'https://www.ems.post/en/global-network/tracking?item={tracking_number}', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, tracking_url_format = EXCLUDED.tracking_url_format;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_shipping_rates_supplier_id ON supplier_shipping_rates(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_shipping_rates_country_id ON supplier_shipping_rates(country_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_country_id ON orders(shipping_country_id);
CREATE INDEX IF NOT EXISTS idx_shipments_courier_id ON shipments(courier_id);
