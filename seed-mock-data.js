const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = 'https://bqjsimigctrfywqiflah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxanNpbWlnY3RyZnl3cWlmbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODU2NzQsImV4cCI6MjA4NDA2MTY3NH0.hmAFJDxrgFBTDi6yOz2pJ2jaMwp-f_7jrmSZNyljHso';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
  console.log('Seeding countries...');
  const countries = [
    { name: 'United States', code: 'US', vat_percentage: 0, vat_type: 'added', is_active: true },
    { name: 'United Kingdom', code: 'UK', vat_percentage: 20, vat_type: 'added', is_active: true },
    { name: 'Germany', code: 'DE', vat_percentage: 19, vat_type: 'included', is_active: true },
    { name: 'Australia', code: 'AU', vat_percentage: 10, vat_type: 'added', is_active: true },
    { name: 'United Arab Emirates', code: 'AE', vat_percentage: 5, vat_type: 'added', is_active: true },
    { name: 'Saudi Arabia', code: 'SA', vat_percentage: 15, vat_type: 'added', is_active: true },
    { name: 'India', code: 'IN', vat_percentage: 18, vat_type: 'added', is_active: true },
    { name: 'Singapore', code: 'SG', vat_percentage: 9, vat_type: 'added', is_active: true },
  ];

  const { error: countriesError } = await supabase.from('countries').upsert(countries, { onConflict: 'code' });
  if (countriesError) {
    console.error('Error seeding countries:', countriesError);
  } else {
    console.log('Countries seeded successfully!');
  }

  console.log('Seeding couriers...');
  const couriers = [
    { name: 'DHL Express', code: 'DHL', tracking_url_format: 'https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}', is_active: true },
    { name: 'FedEx', code: 'FDX', tracking_url_format: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}', is_active: true },
    { name: 'UPS', code: 'UPS', tracking_url_format: 'https://www.ups.com/track?tracknum={tracking_number}', is_active: true },
    { name: 'USPS', code: 'USPS', tracking_url_format: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}', is_active: true },
    { name: 'Aramex', code: 'ARX', tracking_url_format: 'https://www.aramex.com/track/results?mode=0&ShipmentNumber={tracking_number}', is_active: true },
  ];

  const { error: couriersError } = await supabase.from('couriers').upsert(couriers, { onConflict: 'code' });
  if (couriersError) {
    console.error('Error seeding couriers:', couriersError);
  } else {
    console.log('Couriers seeded successfully!');
  }

  console.log('Mock data seeding complete!');
}

seedData();
