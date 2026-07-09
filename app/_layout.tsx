import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme, ThemeProvider } from '@/contexts/ThemeContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key_replace_me';

function RootNavigator() {
  const Colors = useTheme();

  return (
    <>
      <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background.primary },
          animation: 'fade',
        }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="supplier" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" backgroundColor={Colors.background.primary} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
                <RootNavigator />
              </StripeProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
