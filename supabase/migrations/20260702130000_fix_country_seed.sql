-- Fix country seed to match exactly the 10 required countries
-- Deactivate all countries NOT in the required list
UPDATE countries SET is_active = false
WHERE code NOT IN ('US', 'GB', 'CA', 'AU', 'JP', 'KR', 'NP', 'AE', 'RU', 'EU');

-- Also hard-delete any extras so supplier shipping rate screens only show the 10
DELETE FROM supplier_shipping_rates
WHERE country_id IN (
  SELECT id FROM countries
  WHERE code NOT IN ('US', 'GB', 'CA', 'AU', 'JP', 'KR', 'NP', 'AE', 'RU', 'EU')
);

DELETE FROM countries
WHERE code NOT IN ('US', 'GB', 'CA', 'AU', 'JP', 'KR', 'NP', 'AE', 'RU', 'EU');

-- Upsert the 10 required countries with correct VAT settings
INSERT INTO countries (name, code, vat_percentage, vat_type, is_active) VALUES
  ('United States',        'US', 0,  'excluded', true),
  ('United Kingdom',       'GB', 20, 'included', true),
  ('Canada',               'CA', 5,  'excluded', true),
  ('Australia',            'AU', 10, 'included', true),
  ('Japan',                'JP', 10, 'included', true),
  ('South Korea',          'KR', 10, 'included', true),
  ('Nepal',                'NP', 13, 'included', true),
  ('United Arab Emirates', 'AE', 5,  'excluded', true),
  ('Russia',               'RU', 20, 'included', true),
  ('Europe (General)',     'EU', 20, 'included', true)
ON CONFLICT (code) DO UPDATE SET
  name           = EXCLUDED.name,
  vat_percentage = EXCLUDED.vat_percentage,
  vat_type       = EXCLUDED.vat_type,
  is_active      = EXCLUDED.is_active,
  updated_at     = now();
