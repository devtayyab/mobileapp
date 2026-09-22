import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate from 1 USD (1 USD = X Currency)
  flag: string;
  decimals: number;
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, flag: '🇺🇸', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧', decimals: 2 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 3.67, flag: '🇦🇪', decimals: 2 },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal', rate: 3.75, flag: '🇸🇦', decimals: 2 },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', rate: 0.31, flag: '🇰🇼', decimals: 3 },
  { code: 'OMR', symbol: 'RO', name: 'Omani Rial', rate: 0.38, flag: '🇴🇲', decimals: 3 },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', rate: 3.64, flag: '🇶🇦', decimals: 2 },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', rate: 0.38, flag: '🇧🇭', decimals: 3 },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', rate: 278.50, flag: '🇵🇰', decimals: 0 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.5, flag: '🇮🇳', decimals: 2 },
  { code: 'NPR', symbol: 'Rs', name: 'Nepali Rupee', rate: 133.40, flag: '🇳🇵', decimals: 0 },
  { code: 'BDT', symbol: 'Tk', name: 'Bangladeshi Taka', rate: 117.0, flag: '🇧🇩', decimals: 2 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.36, flag: '🇨🇦', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.52, flag: '🇦🇺', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 155.0, flag: '🇯🇵', decimals: 0 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.25, flag: '🇨🇳', decimals: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.90, flag: '🇨🇭', decimals: 2 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 34.0, flag: '🇹🇷', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.35, flag: '🇸🇬', decimals: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.70, flag: '🇲🇾', decimals: 2 },
];

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  formatPrice: (amount: number) => string;
  convertToBase: (amount: number) => number;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = '@app_currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((code) => {
      if (code) {
        const found = CURRENCIES.find((c) => c.code === code);
        if (found) setCurrencyState(found);
      }
    });
  }, []);

  const setCurrency = async (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    await AsyncStorage.setItem(STORAGE_KEY, newCurrency.code);
  };

  const formatPrice = (amount: number) => {
    const converted = amount * currency.rate;
    return `${currency.symbol} ${converted.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    })}`;
  };

  const convertToBase = (amount: number) => {
    return amount / currency.rate;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertToBase }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
