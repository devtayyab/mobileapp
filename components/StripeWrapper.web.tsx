import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// The @stripe/stripe-react-native package often has issues compiling for web.
// This web-specific file bypasses it so the app can run on the web browser.
// If you need Stripe functionality on the web later, you should install and use @stripe/stripe-js here.
export default function StripeWrapper({ children, publishableKey: fallbackKey }: { children: React.ReactNode, publishableKey: string }) {
  const [pubKey, setPubKey] = useState<string>(fallbackKey);

  useEffect(() => {
    async function fetchKey() {
      const { data, error } = await supabase.rpc('get_stripe_publishable_key');
      if (data) {
        setPubKey(data);
      }
    }
    fetchKey();
  }, []);

  return (
    <>
      {children}
    </>
  );
}
