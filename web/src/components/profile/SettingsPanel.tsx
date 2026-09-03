'use client';

/**
 * Settings — port of mobile `app/profile/settings.tsx`.
 *
 * NOTIFICATION TOGGLES ARE NOT PERSISTED SERVER-SIDE. On mobile they are plain
 * `useState` values in the screen (push / email / order updates / promotions),
 * and there is no column on `profiles` nor any preferences table behind them in
 * `supabase/migrations/` — nothing reads them, and they reset on reload. Rather
 * than fake a saved preference, this panel keeps them per-browser in
 * localStorage and says so on the card. Wiring them to real delivery needs a
 * schema change (see the report), which this port deliberately does not invent.
 *
 * Language, currency and colour scheme go through the existing providers, which
 * already persist: language in a cookie, currency and scheme in localStorage.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Check, Globe, Lock, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { ConfirmDialog } from '@/components/ui';
import { SupplierToggle } from '@/components/supplier/SupplierToggle';
import { cn } from '@/lib/cn';

/** Mobile's four switches and their initial values. */
const NOTIFICATION_KEYS = [
  { key: 'push', labelKey: 'pushNotifications', label: 'Push Notifications', hint: 'Receive push notifications', initial: true },
  { key: 'email', labelKey: 'emailNotifications', label: 'Email Notifications', hint: 'Receive email updates', initial: true },
  { key: 'orders', labelKey: 'orderUpdates', label: 'Order Updates', hint: 'Get notified about orders', initial: true },
  { key: 'promotions', labelKey: 'promotions', label: 'Promotions', hint: 'Receive promotional offers', initial: false },
] as const;

type NotificationPrefs = Record<string, boolean>;

const PREFS_STORAGE_KEY = 'local_notification_prefs';

function defaultPrefs(): NotificationPrefs {
  return Object.fromEntries(NOTIFICATION_KEYS.map((n) => [n.key, n.initial]));
}

export function SettingsPanel() {
  const router = useRouter();
  const { t, language, languages, setLanguage } = useLanguage();
  const { currency, currencies, setCurrency } = useCurrency();
  const { scheme, setScheme } = useAppTheme();

  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [signOutOpen, setSignOutOpen] = useState(false);

  // Read the browser-local values after mount so server and client markup match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) setPrefs({ ...defaultPrefs(), ...(JSON.parse(raw) as NotificationPrefs) });
    } catch {
      // blocked or corrupt storage — keep the defaults
    }
  }, []);

  const setPref = (key: string, value: boolean) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      try {
        window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // non-fatal: the choice just won't survive a reload
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    setSignOutOpen(false);
    await createClient().auth.signOut();
    router.replace('/welcome');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Back to account"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary transition-colors hover:text-content-primary"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          {t.settings ?? 'Settings'}
        </h1>
      </div>

      <Section icon={<Bell size={20} />} title={t.notifications ?? 'Notifications'}>
        <p className="rounded-lg bg-surface-tint px-3 py-2 text-base text-content-tertiary">
          These switches are stored in this browser only. The backend has no
          notification-preference column yet, so they do not change what is actually
          delivered — on any device or in the mobile app.
        </p>

        {NOTIFICATION_KEYS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3 border-t border-edge-light pt-3 first-of-type:border-t-0 first-of-type:pt-0"
          >
            <div className="min-w-0">
              <p className="text-lg font-bold text-content-primary">
                {t[item.labelKey] ?? item.label}
              </p>
              <p className="mt-0.5 text-md text-content-tertiary">{item.hint}</p>
            </div>
            <SupplierToggle
              checked={prefs[item.key] ?? item.initial}
              onChange={(next) => setPref(item.key, next)}
              label={t[item.labelKey] ?? item.label}
            />
          </div>
        ))}
      </Section>

      <Section icon={<Globe size={20} />} title={t.selectLanguage ?? 'Language'}>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {languages.map((option) => {
            const active = option.code === language.code;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setLanguage(option.code)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left text-md transition-colors',
                  active
                    ? 'border-primary bg-surface-tint font-bold text-primary'
                    : 'border-edge text-content-primary hover:bg-surface-page'
                )}
              >
                <span className="text-2xl">{option.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{option.nativeName}</span>
                  <span className="block truncate text-sm text-content-tertiary">
                    {option.name}
                  </span>
                </span>
                {active && <Check size={18} />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        icon={<span className="text-3xl font-bold">{currency.symbol}</span>}
        title={t.currency ?? 'Currency'}
      >
        <div className="grid gap-1.5 sm:grid-cols-2">
          {currencies.map((option) => {
            const active = option.code === currency.code;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setCurrency(option)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left text-md transition-colors',
                  active
                    ? 'border-primary bg-surface-tint font-bold text-primary'
                    : 'border-edge text-content-primary hover:bg-surface-page'
                )}
              >
                <span className="text-2xl">{option.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{option.name}</span>
                  <span className="block truncate text-sm text-content-tertiary">
                    {option.code} ({option.symbol})
                  </span>
                </span>
                {active && <Check size={18} />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={<Monitor size={20} />} title={t.theme ?? 'Appearance'}>
        <div className="flex gap-1.5">
          {(
            [
              { value: 'light' as const, label: t.lightMode ?? 'Light', icon: <Sun size={18} /> },
              { value: 'dark' as const, label: t.darkMode ?? 'Dark', icon: <Moon size={18} /> },
            ]
          ).map((option) => {
            const active = scheme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setScheme(option.value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] py-3 text-md transition-colors',
                  active
                    ? 'border-primary bg-surface-tint font-bold text-primary'
                    : 'border-edge text-content-primary hover:bg-surface-page'
                )}
              >
                {option.icon}
                {option.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={<Lock size={20} />} title={t.privacy ?? 'Privacy & Security'}>
        <Link
          href="/forgot-password"
          className="flex items-center gap-3 rounded-xl px-1 py-2 text-lg font-bold text-content-primary transition-colors hover:text-primary"
        >
          <Lock size={20} className="text-content-tertiary" />
          {t.changePassword ?? 'Change Password'}
        </Link>
      </Section>

      <button
        type="button"
        onClick={() => setSignOutOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-error/20 bg-surface py-3.5 text-lg font-bold text-error transition-colors hover:bg-error/5"
      >
        <LogOut size={18} />
        {t.signOut ?? 'Sign Out'}
      </button>

      <ConfirmDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => void handleSignOut()}
        title={t.signOut ?? 'Sign Out'}
        message={t.signOutConfirm ?? 'Are you sure you want to sign out?'}
        confirmLabel={t.signOut ?? 'Sign Out'}
        destructive
      />
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <div className="mb-3.5 flex items-center gap-2 text-primary">
        {icon}
        <h2 className="text-2xl font-bold text-content-primary">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
