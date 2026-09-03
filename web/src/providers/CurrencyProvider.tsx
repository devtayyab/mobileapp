'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** Ported verbatim from contexts/CurrencyContext.tsx (static rates from 1 USD). */
export type Currency = {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  flag: string;
  decimals: number;
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, flag: '🇺🇸', decimals: 2 },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', rate: 0.31, flag: '🇰🇼', decimals: 3 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺', decimals: 2 },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal', rate: 3.75, flag: '🇸🇦', decimals: 2 },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', rate: 278.5, flag: '🇵🇰', decimals: 0 },
  { code: 'NPR', symbol: 'Rs', name: 'Nepali Rupee', rate: 133.4, flag: '🇳🇵', decimals: 0 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 3.67, flag: '🇦🇪', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧', decimals: 2 },
  { code: 'OMR', symbol: 'RO', name: 'Omani Rial', rate: 0.38, flag: '🇴🇲', decimals: 3 },
];

type CurrencyContextValue = {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (currency: Currency) => void;
  /** Display helper — matches mobile's `${symbol} ${amount}` spacing. */
  formatPrice: (amount: number) => string;
  /** Display currency -> USD, used before writing to the DB. */
  convertToBase: (amount: number) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = 'app_currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]);

  useEffect(() => {
    try {
      const code = window.localStorage.getItem(STORAGE_KEY);
      if (code) {
        const found = CURRENCIES.find((c) => c.code === code);
        if (found) setCurrencyState(found);
      }
    } catch {
      // blocked storage — stay on USD
    }
  }, []);

  const setCurrency = (next: Currency) => {
    setCurrencyState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next.code);
    } catch {
      // non-fatal
    }
  };

  const formatPrice = (amount: number) => {
    const converted = amount * currency.rate;
    return `${currency.symbol} ${converted.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencies: CURRENCIES,
        setCurrency,
        formatPrice,
        convertToBase: (amount: number) => amount / currency.rate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
