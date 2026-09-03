import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { getAdminProfile } from '@/lib/supabase/server';
import { LANGUAGE_COOKIE } from '@/lib/i18n-config';

export const metadata: Metadata = {
  title: 'SATHUN GLOBAL Marketplace',
  description: 'B2B & B2C marketplace — shop, sell, and manage your business',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolve role server-side so the correct palette paints on first render.
  const [{ user, profile }, cookieStore] = await Promise.all([getAdminProfile(), cookies()]);
  const language = cookieStore.get(LANGUAGE_COOKIE)?.value ?? 'en';
  const role = profile?.role ?? null;

  const paletteAttr =
    role === 'b2b' ? 'wholesale' : role === 'supplier' || role === 'admin' ? 'retailer' : 'customer';

  return (
    <html lang={language} data-role={paletteAttr} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProviders role={role} userId={user?.id ?? null} initialLanguage={language}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
