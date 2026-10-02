'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Globe,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  ShoppingCart,
  Sun,
  User,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/providers/CartProvider';
import { useNotifications } from '@/providers/NotificationProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import type { Role } from '@/types/database';

const NAV = [
  { href: '/', labelKey: 'home', fallback: 'Home' },
  { href: '/shop', labelKey: 'shop', fallback: 'Shop' },
  { href: '/categories', labelKey: 'categories', fallback: 'Categories' },
  { href: '/orders', labelKey: 'orders', fallback: 'Orders' },
];

export function StorefrontHeader({
  role,
  displayName,
}: {
  role: Role | null;
  displayName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const { unreadCount } = useNotifications();
  const { scheme, toggleScheme } = useAppTheme();
  const { t, language, languages, setLanguage } = useLanguage();
  const { currency, currencies, setCurrency } = useCurrency();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return languages;
    const q = langSearch.trim().toLowerCase();
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [languages, langSearch]);

  const isSignedIn = role != null;
  const canManage = role === 'supplier' || role === 'admin';

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/welcome');
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-edge bg-surface-translucent backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-4">
          <BrandLogo size="md" />

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-md font-bold transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-content-tertiary hover:text-content-primary'
                  )}
                >
                  {t[item.labelKey] ?? item.fallback}
                  {active && (
                    <motion.span
                      layoutId="storefront-nav"
                      className="absolute inset-x-2 -bottom-[13px] h-[2px] rounded-full bg-primary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setPrefsOpen(true)}
              aria-label="Language and currency"
              className="hidden h-10 items-center gap-1.5 rounded-lg border border-edge px-2.5 text-base font-bold text-content-tertiary hover:text-content-primary sm:flex"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">
                {language.code.toUpperCase()} · {currency.code}
              </span>
            </button>

            <button
              onClick={toggleScheme}
              aria-label={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary hover:text-content-primary sm:flex"
            >
              {scheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isSignedIn && (
              <Link
                href="/chat"
                aria-label="Messages"
                className="hidden h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary hover:text-content-primary sm:flex"
              >
                <MessageSquare size={18} />
              </Link>
            )}

            {isSignedIn && (
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary hover:text-content-primary"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-surface bg-secondary px-1 text-2xs font-extrabold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary hover:text-content-primary"
            >
              <ShoppingCart size={18} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-surface bg-primary px-1 text-2xs font-extrabold text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {canManage && (
              <Link
                href={role === 'admin' ? '/admin' : '/supplier/dashboard'}
                className="hidden h-10 items-center gap-1.5 rounded-lg border border-edge px-3 text-base font-bold text-content-tertiary hover:text-content-primary sm:flex"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}

            {isSignedIn ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/profile"
                  className="flex h-10 items-center gap-2 rounded-lg border border-edge px-2.5 text-base font-bold text-content-primary"
                >
                  <User size={16} />
                  <span className="hidden max-w-[8rem] truncate lg:inline">
                    {displayName ?? 'Account'}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="hidden h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary hover:text-error sm:flex"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" className="whitespace-nowrap">
                  {t.signIn ?? 'Sign in'}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/*
          Mobile row: the nav links, plus the controls the top row drops below
          `sm` (language/currency, colour scheme, messages, dashboard, sign
          out). Seven 40px controls plus the wordmark do not fit a 375px header
          without the wordmark wrapping, so they move here instead of becoming
          unreachable on a phone. The row scrolls horizontally.
        */}
        <nav className="flex items-center gap-1.5 overflow-x-auto border-t border-edge px-3 py-2 scrollbar-none md:hidden overscroll-x-contain">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-xl px-3.5 py-2 text-base font-bold transition-colors min-h-[38px] flex items-center',
                  active ? 'bg-primary text-white shadow-xs' : 'bg-surface text-content-tertiary border border-edge/60'
                )}
              >
                {t[item.labelKey] ?? item.fallback}
              </Link>
            );
          })}

          <span className="mx-1 h-6 w-px shrink-0 bg-edge" aria-hidden />

          <button
            onClick={() => setPrefsOpen(true)}
            aria-label="Language and currency"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-edge bg-surface px-2.5 text-sm font-bold text-content-secondary shadow-2xs active:scale-95 transition-transform"
          >
            <Globe size={15} className="text-primary" />
            {language.code.toUpperCase()} · {currency.code}
          </button>

          <button
            onClick={toggleScheme}
            aria-label={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface text-content-secondary shadow-2xs active:scale-95 transition-transform"
          >
            {scheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isSignedIn && (
            <Link
              href="/chat"
              aria-label="Messages"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface text-content-secondary shadow-2xs active:scale-95 transition-transform"
            >
              <MessageSquare size={17} />
            </Link>
          )}

          {canManage && (
            <Link
              href={role === 'admin' ? '/admin' : '/supplier/dashboard'}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-edge bg-surface px-2.5 text-sm font-bold text-primary shadow-2xs active:scale-95 transition-transform"
            >
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
          )}

          {isSignedIn && (
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface text-content-tertiary hover:text-error shadow-2xs active:scale-95 transition-transform"
            >
              <LogOut size={16} />
            </button>
          )}
        </nav>
      </header>

      <Modal
        open={prefsOpen}
        onClose={() => {
          setPrefsOpen(false);
          setLangSearch('');
        }}
        title={t.general ?? 'Preferences'}
        size="md"
      >
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-md font-bold text-content-primary">
                {t.selectLanguage ?? 'Language'} ({languages.length})
              </p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-semibold text-primary">
                Full-page DOM translation
              </span>
            </div>

            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              placeholder="Search language (e.g. Greek, Urdu, Nepali, Spanish)..."
              className="mb-2 w-full rounded-xl border border-edge bg-surface px-3 py-1.5 text-sm text-content-primary placeholder:text-content-tertiary focus:border-primary focus:outline-none"
            />

            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {filteredLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    if (l.defaultCurrency) {
                      const suggested = currencies.find((c) => c.code === l.defaultCurrency);
                      if (suggested) {
                        setCurrency(suggested);
                      }
                    }
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-md transition-colors',
                    l.code === language.code
                      ? 'bg-surface-tint font-bold text-primary border border-primary/20'
                      : 'hover:bg-surface-page text-content-secondary'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{l.flag}</span>
                    <span>{l.nativeName}</span>
                    <span className="text-2xs text-content-tertiary">({l.name})</span>
                  </div>
                  {l.defaultCurrency && (
                    <span className="text-2xs font-bold text-content-tertiary">
                      Auto: {l.defaultCurrency}
                    </span>
                  )}
                </button>
              ))}

              {filteredLanguages.length === 0 && (
                <p className="py-4 text-center text-sm text-content-tertiary">
                  No language found matching &ldquo;{langSearch}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-md font-bold text-content-primary">
              {t.currency ?? 'Currency'}
            </p>
            <div className="max-h-52 space-y-1 overflow-y-auto">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-md',
                    c.code === currency.code
                      ? 'bg-surface-tint font-bold text-primary'
                      : 'hover:bg-surface-page'
                  )}
                >
                  <span>{c.flag}</span>
                  {c.code} · {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
