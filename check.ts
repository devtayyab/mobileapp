import { createClient } from '@supabase/supabase-js';

// Get these from .env if possible, or we can just try to load them
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('payment_settings').select('*');
  console.log('Payment Settings:', data);
  console.log('Error:', error);
}

check();
