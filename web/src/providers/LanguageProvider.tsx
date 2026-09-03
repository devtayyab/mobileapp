'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import i18n, { buildTranslations, type Translations } from '@/lib/i18n';
import {
  LANGUAGES,
  LANGUAGE_COOKIE,
  isRtl,
  type Language,
} from '@/lib/i18n-config';

type LanguageContextValue = {
  language: Language;
  languages: Language[];
  t: Translations;
  setLanguage: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({
  initialLanguage = 'en',
  children,
}: {
  initialLanguage?: string;
  children: ReactNode;
}) {
  const [code, setCode] = useState(initialLanguage);

  const language = useMemo(
    () => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0],
    [code]
  );

  const t = useMemo(() => buildTranslations(code), [code]);

  useEffect(() => {
    void i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = isRtl(code) ? 'rtl' : 'ltr';
  }, [code]);

  const setLanguage = (next: string) => {
    setCode(next);
    // Cookie (not localStorage) so the server can render the right language.
    document.cookie = `${LANGUAGE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
  };

  return (
    <LanguageContext.Provider value={{ language, languages: LANGUAGES, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
