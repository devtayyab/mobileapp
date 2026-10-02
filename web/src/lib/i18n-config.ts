/**
 * Server-safe i18n constants. Deliberately imports NOTHING — importing the
 * i18next instance here would drag react-i18next into server components,
 * which crashes with "createContext is not a function".
 */
export type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  defaultCurrency: string;
  rtl?: boolean;
};

// Mirrors LANGUAGES in contexts/LanguageContext.tsx with automatic currency suggestions
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', defaultCurrency: 'USD', rtl: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', defaultCurrency: 'EUR', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', defaultCurrency: 'EUR', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', defaultCurrency: 'EUR', rtl: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', defaultCurrency: 'NPR', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', defaultCurrency: 'SAR', rtl: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', defaultCurrency: 'EUR', rtl: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', defaultCurrency: 'PKR', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', defaultCurrency: 'INR', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', defaultCurrency: 'CNY', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', defaultCurrency: 'EUR', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', defaultCurrency: 'TRY', rtl: false },
];

export const LANGUAGE_COOKIE = 'app_language';

export function isRtl(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}
