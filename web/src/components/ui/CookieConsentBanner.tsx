'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, Check, X, Settings2 } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

const COOKIE_STORAGE_KEY = 'sathun_cookie_consent';

export type CookiePreferences = {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    preferences: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!stored) {
        // Small delay so page loads smoothly first
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage blocked
    }
  }, []);

  const saveConsent = (status: 'accepted' | 'rejected' | 'custom', prefs?: CookiePreferences) => {
    try {
      const data = {
        status,
        timestamp: new Date().toISOString(),
        preferences: prefs ?? preferences,
      };
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(data));
      document.cookie = `cookie_consent=${status};path=/;max-age=31536000;samesite=lax`;
    } catch {
      // ignore storage error
    }
    setIsOpen(false);
    setSettingsOpen(false);
  };

  const handleAcceptAll = () => {
    const all = { essential: true, preferences: true, analytics: true, marketing: true };
    setPreferences(all);
    saveConsent('accepted', all);
  };

  const handleReject = () => {
    const min = { essential: true, preferences: false, analytics: false, marketing: false };
    setPreferences(min);
    saveConsent('rejected', min);
  };

  const handleSaveCustom = () => {
    saveConsent('custom', preferences);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl"
          >
            <div className="rounded-3xl border border-edge/80 bg-surface/95 p-5 sm:p-6 shadow-glow backdrop-blur-md">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Cookie className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-content-primary">
                      Cookie &amp; Privacy Choices
                    </h3>
                    <p className="text-sm leading-relaxed text-content-tertiary">
                      This website uses cookies to ensure you get the best experience, remember your preferences, and maintain secure checkouts. By clicking “Accept”, you consent to our use of cookies in accordance with our{' '}
                      <Link href="/privacy" className="font-semibold text-primary underline hover:text-primary-dark">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center gap-1.5"
                  >
                    <Settings2 size={15} />
                    Manage Settings
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReject}
                    className="text-content-tertiary hover:text-content-primary"
                  >
                    Reject Non-Essential
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAcceptAll}
                    className="shadow-sm"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Settings Modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Cookie & Privacy Settings"
        size="md"
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleReject}>
              Reject All
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveCustom}>
                Save Preferences
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-content-tertiary">
            Customize your cookie settings below. Essential cookies are required for fundamental operations such as secure shopping cart and account authentication.
          </p>

          <div className="space-y-3 divide-y divide-edge">
            {/* Essential */}
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-content-primary">Strictly Necessary</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-2xs font-extrabold text-primary">Required</span>
                </div>
                <p className="text-xs text-content-tertiary">
                  Essential for website security, user login, and cart sessions. Cannot be disabled.
                </p>
              </div>
              <input type="checkbox" checked disabled className="h-5 w-5 accent-primary opacity-60" />
            </div>

            {/* Preferences */}
            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5 pr-4">
                <span className="font-bold text-sm text-content-primary">Preferences &amp; Localization</span>
                <p className="text-xs text-content-tertiary">
                  Remembers your selected language, display currency, and theme settings.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.preferences}
                onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                className="h-5 w-5 accent-primary cursor-pointer"
              />
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5 pr-4">
                <span className="font-bold text-sm text-content-primary">Analytics &amp; Performance</span>
                <p className="text-xs text-content-tertiary">
                  Helps us understand how visitors interact with the marketplace to improve speed and features.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="h-5 w-5 accent-primary cursor-pointer"
              />
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5 pr-4">
                <span className="font-bold text-sm text-content-primary">Marketing &amp; Personalization</span>
                <p className="text-xs text-content-tertiary">
                  Allows relevant product recommendations and promotional offers tailored to your business interests.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                className="h-5 w-5 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
