'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Role } from '@/types/database';

/**
 * Mirrors contexts/ThemeContext.tsx on mobile: the palette is chosen by the
 * signed-in user's role (customer=green, supplier/admin=blue, b2b=pink).
 * Dark mode is a web-only addition layered on top.
 */
type PaletteName = 'customer' | 'retailer' | 'wholesale';

const PALETTE_FOR_ROLE: Record<Role, PaletteName> = {
  customer: 'customer',
  b2b: 'wholesale',
  supplier: 'retailer',
  admin: 'retailer',
};

type ColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  palette: PaletteName;
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const SCHEME_KEY = 'app_color_scheme';

export function ThemeProvider({
  role,
  children,
}: {
  role: Role | null;
  children: ReactNode;
}) {
  const palette = role ? PALETTE_FOR_ROLE[role] : 'customer';
  const [scheme, setSchemeState] = useState<ColorScheme>('light');

  // Restore the saved scheme; fall back to the OS preference.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(SCHEME_KEY);
    } catch {
      // private mode / blocked storage — fall through to OS preference
    }

    if (stored === 'light' || stored === 'dark') {
      setSchemeState(stored);
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setSchemeState('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.role = palette;
  }, [palette]);

  useEffect(() => {
    if (scheme === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [scheme]);

  const setScheme = (next: ColorScheme) => {
    setSchemeState(next);
    try {
      window.localStorage.setItem(SCHEME_KEY, next);
    } catch {
      // non-fatal: the choice just won't persist
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        palette,
        scheme,
        setScheme,
        toggleScheme: () => setScheme(scheme === 'dark' ? 'light' : 'dark'),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
