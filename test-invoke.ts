import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdge() {
  console.log('Signing up temporary user...');
  const testEmail = `test_${Date.now()}@ebizz.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123'
  });

  if (authError) {
    console.log('Signup failed:', authError.message);
    return;
  }

  console.log('Signup success! User:', authData.user?.id);
  
  console.log('Invoking create-stripe-connect-account...');
  const { data, error } = await supabase.functions.invoke('create-stripe-connect-account');
  
  console.log('=============================');
  console.log('EDGE FUNCTION RESPONSE:');
  console.log('DATA:', data);
  if (error) {
    console.log('ERROR MESSAGE:', error.message);
    if (error.context) {
      try {
        const body = await error.context.json();
        console.log('ERROR JSON BODY:', body);
      } catch(e) {
        console.log('Could not parse context as JSON');
      }
    }
  }
  console.log('=============================');
}

testEdge();
