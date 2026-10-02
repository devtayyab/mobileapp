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
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', defaultCurrency: 'EUR', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', defaultCurrency: 'RUB', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', defaultCurrency: 'JPY', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', defaultCurrency: 'KRW', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', defaultCurrency: 'EUR', rtl: false },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', defaultCurrency: 'PLN', rtl: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', defaultCurrency: 'SEK', rtl: false },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', defaultCurrency: 'BDT', rtl: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', defaultCurrency: 'IDR', rtl: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', defaultCurrency: 'VND', rtl: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', defaultCurrency: 'THB', rtl: false },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', defaultCurrency: 'AED', rtl: true },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', defaultCurrency: 'RON', rtl: false },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', defaultCurrency: 'CZK', rtl: false },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', defaultCurrency: 'HUF', rtl: false },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', defaultCurrency: 'UAH', rtl: false },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', defaultCurrency: 'ILS', rtl: true },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', defaultCurrency: 'MYR', rtl: false },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', defaultCurrency: 'PHP', rtl: false },
];

export const LANGUAGE_COOKIE = 'app_language';

export function isRtl(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? ['ar', 'ur', 'fa', 'he'].includes(code);
}

/**
 * Normalizes language codes for the Google Website Translator DOM engine
 */
export function getGoogleTranslateCode(langCode: string): string {
  if (langCode === 'zh') return 'zh-CN';
  if (langCode === 'he') return 'iw';
  if (langCode === 'fil') return 'tl';
  return langCode;
}

