import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { createClient } from '@/lib/supabase/client';

let stripePromise: Promise<Stripe | null> | null = null;

async function resolvePublishableKey(): Promise<string> {
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (envKey && envKey.startsWith('pk_') && envKey !== 'pk_test_sample') {
    return envKey;
  }

  // Fallback to retrieving the active publishable key from Supabase via RPC
  try {
    const supabase = createClient();
    const { data } = await supabase.rpc('get_stripe_publishable_key');
    if (data && typeof data === 'string' && data.startsWith('pk_')) {
      return data;
    }
  } catch (err) {
    console.error('Failed to retrieve Stripe publishable key via RPC:', err);
  }

  return envKey ?? '';
}

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = resolvePublishableKey().then((key) => {
      if (!key) {
        console.warn('Stripe publishable key is missing.');
        return null;
      }
      return loadStripe(key);
    });
  }
  return stripePromise;
}
