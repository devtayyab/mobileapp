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
  rtl?: boolean;
};

// Mirrors LANGUAGES in contexts/LanguageContext.tsx
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', rtl: false },
];

export const LANGUAGE_COOKIE = 'app_language';

export function isRtl(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}
