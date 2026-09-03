import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

function parseRecoveryParams(url: string) {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return null;

  const params = new URLSearchParams(url.substring(hashIndex + 1));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  const type = params.get('type');

  if (!access_token || type !== 'recovery') return null;

  return { access_token, refresh_token: refresh_token ?? '' };
}

export function useAuthDeepLink() {
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes('reset-password')) return;

      const tokens = parseRecoveryParams(url);
      if (!tokens) return;

      const { error } = await supabase.auth.setSession(tokens);
      if (!error) {
        router.replace('/(auth)/reset-password');
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => subscription.remove();
  }, []);
}
