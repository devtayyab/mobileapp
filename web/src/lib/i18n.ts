'use client';

/**
 * Shares the mobile app's translation resources (repo-root lib/i18n.ts) rather
 * than duplicating ~230 keys x 5 languages. That module only imports
 * i18next/react-i18next, so it is safe on the web — but ONLY in client
 * components, since react-i18next needs React.createContext.
 *
 * Server components must import from '@/lib/i18n-config' instead.
 */
import i18n from '@shared/lib/i18n';

export type Translations = Record<string, string>;

/**
 * The mobile app exposes translations as a flat object (`t.addToCart`), not a
 * function, so screens port over unchanged. Rebuild that shape here.
 */
export function buildTranslations(lng: string): Translations {
  const englishKeys = Object.keys(
    (i18n.getResourceBundle('en', 'translation') ?? {}) as Record<string, string>
  );

  const t: Translations = {};
  for (const key of englishKeys) {
    t[key] = i18n.t(key, { lng }) as string;
  }
  return t;
}

export default i18n;
