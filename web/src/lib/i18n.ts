'use client';

/**
 * The web app initializes its OWN i18next instance from the translation
 * resources shared with the mobile app (`@shared/lib/translations`).
 *
 * We import the dependency-free data module rather than the mobile app's
 * initialized instance (`@shared/lib/i18n`): that file imports i18next, and
 * because it lives outside this project, bundlers resolve its imports from the
 * repo root's node_modules — which Vercel does not install. Sharing pure data
 * keeps one source of truth for ~230 keys x 5 languages with no cross-package
 * module resolution.
 *
 * Server components must import from '@/lib/i18n-config' instead; react-i18next
 * needs React.createContext, which RSC does not provide.
 */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@shared/lib/translations';

const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

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
