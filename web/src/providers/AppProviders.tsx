'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { LanguageProvider } from './LanguageProvider';
import { CurrencyProvider } from './CurrencyProvider';
import { ToastProvider } from './ToastProvider';
import { NotificationProvider } from './NotificationProvider';
import { CartProvider } from './CartProvider';
import type { Role } from '@/types/database';

/**
 * Provider tree, ordered to mirror app/_layout.tsx on mobile.
 * Toast sits above Notification/Cart because both raise toasts.
 */
export function AppProviders({
  role,
  userId,
  initialLanguage,
  children,
}: {
  role: Role | null;
  userId: string | null;
  initialLanguage?: string;
  children: ReactNode;
}) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <CurrencyProvider>
        <ThemeProvider role={role}>
          <ToastProvider>
            <NotificationProvider userId={userId}>
              <CartProvider userId={userId}>{children}</CartProvider>
            </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
