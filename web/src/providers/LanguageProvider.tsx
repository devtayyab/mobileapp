'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import i18n, { buildTranslations, type Translations } from '@/lib/i18n';
import {
  LANGUAGES,
  LANGUAGE_COOKIE,
  isRtl,
  getGoogleTranslateCode,
  type Language,
} from '@/lib/i18n-config';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            autoDisplay?: boolean;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

// Monkey-patch Node.prototype to prevent React DOM reconciliation errors
// when Google Translate injects <font> tags into text nodes.
if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
  const nodeProto = Node.prototype as unknown as {
    __react_gt_patched?: boolean;
    removeChild: <T extends Node>(child: T) => T;
    insertBefore: <T extends Node>(newNode: T, referenceNode: Node | null) => T;
  };

  if (!nodeProto.__react_gt_patched) {
    nodeProto.__react_gt_patched = true;
    const originalRemoveChild = nodeProto.removeChild;
    nodeProto.removeChild = function <T extends Node>(this: Node, child: T): T {
      if (child.parentNode !== this) {
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    const originalInsertBefore = nodeProto.insertBefore;
    nodeProto.insertBefore = function <T extends Node>(
      this: Node,
      newNode: T,
      referenceNode: Node | null
    ): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        return newNode;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };
  }
}

/**
 * Triggers Google Website Translator to translate the entire visible DOM
 */
function applyGoogleTranslation(targetCode: string) {
  if (typeof window === 'undefined') return;

  const hostname = window.location.hostname;
  const hostParts = hostname.split('.');
  const rootDomain = hostParts.length > 1 ? `.${hostParts.slice(-2).join('.')}` : '';

  if (targetCode === 'en') {
    // Expire googtrans cookie across root domain, hostname, and path
    const domains = ['', hostname, `.${hostname}`, rootDomain];
    domains.forEach((d) => {
      const dAttr = d ? `; domain=${d}` : '';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${dAttr}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${d}`;
    });

    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = '';
      select.dispatchEvent(new Event('change'));
    }

    // If Google Translate previously translated the DOM, clean reload restores original English
    setTimeout(() => {
      const hasTranslatedFonts = document.querySelector('font') !== null;
      if (hasTranslatedFonts) {
        window.location.reload();
      }
    }, 350);
    return;
  }

  // Not English: apply Google Translate
  const googleLang = getGoogleTranslateCode(targetCode);
  const cookieVal = `/en/${googleLang}`;

  document.cookie = `googtrans=${cookieVal}; path=/;`;
  if (hostname) {
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
  }
  if (rootDomain) {
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${rootDomain};`;
  }

  // Poll for .goog-te-combo (Google Translate dropdown) to apply translation
  let attempts = 0;
  const maxAttempts = 30; // 30 * 100ms = 3 seconds
  const interval = setInterval(() => {
    attempts++;
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      clearInterval(interval);
      if (select.value !== googleLang) {
        select.value = googleLang;
        select.dispatchEvent(new Event('change'));
      }
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 100);
}

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
  const pathname = usePathname();

  const language = useMemo(
    () => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0],
    [code]
  );

  const t = useMemo(() => buildTranslations(code), [code]);

  // Load Google Translate script and initialize engine
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              autoDisplay: false,
            },
            'google_translate_element'
          );

          // If current language is not English, trigger translation on init
          if (code !== 'en') {
            const googleLang = getGoogleTranslateCode(code);
            setTimeout(() => {
              const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
              if (select && select.value !== googleLang) {
                select.value = googleLang;
                select.dispatchEvent(new Event('change'));
              }
            }, 300);
          }
        }
      } catch {
        // ignore init failure
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [code]);

  // Automatic browser/device language detection when no explicit cookie is set
  useEffect(() => {
    try {
      const hasCookie = document.cookie
        .split('; ')
        .some((row) => row.startsWith(`${LANGUAGE_COOKIE}=`));

      if (!hasCookie && typeof navigator !== 'undefined' && navigator.language) {
        const browserCode = navigator.language.split('-')[0].toLowerCase();
        const matched = LANGUAGES.find((l) => l.code === browserCode);
        if (matched && matched.code !== code) {
          setCode(matched.code);
          document.cookie = `${LANGUAGE_COOKIE}=${matched.code};path=/;max-age=31536000;samesite=lax`;
          applyGoogleTranslation(matched.code);
        }
      }
    } catch {
      // Ignore detection errors
    }
  }, []);

  // Sync i18n instance and document attributes
  useEffect(() => {
    void i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = isRtl(code) ? 'rtl' : 'ltr';
  }, [code]);

  // Ensure full-page translation persists across client-side page navigations
  useEffect(() => {
    if (code !== 'en') {
      const timer = setTimeout(() => {
        const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        const googleLang = getGoogleTranslateCode(code);
        if (select && select.value !== googleLang) {
          select.value = googleLang;
          select.dispatchEvent(new Event('change'));
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pathname, code]);

  const setLanguage = (next: string) => {
    setCode(next);
    document.cookie = `${LANGUAGE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    applyGoogleTranslation(next);
  };

  return (
    <LanguageContext.Provider value={{ language, languages: LANGUAGES, t, setLanguage }}>
      <div
        id="google_translate_element"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
