import React, { useEffect, useState } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { supabase } from '@/lib/supabase';

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
    <StripeProvider publishableKey={pubKey}>
      <>{children}</>
    </StripeProvider>
  );
}
