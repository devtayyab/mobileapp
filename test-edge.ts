import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdge() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@ebizz.com',
    password: 'admin123456'
  });

  if (authError) {
    console.log('Login failed:', authError.message);
    // Let's try another password if the first one fails
    const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
      email: 'admin@ebizz.com',
      password: 'admin'
    });
    if (authError2) {
        console.log('Login failed again:', authError2.message);
        return;
    }
  }

  console.log('Logged in successfully!');
  
  console.log('Invoking create-stripe-connect-account...');
  const { data, error } = await supabase.functions.invoke('create-stripe-connect-account');
  
  console.log('Response Data:', data);
  console.log('Response Error:', error);
}

testEdge();
