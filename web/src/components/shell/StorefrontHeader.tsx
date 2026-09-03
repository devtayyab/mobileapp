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
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/providers/CartProvider';
import { useNotifications } from '@/providers/NotificationProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/" className="text-3xl font-extrabold tracking-[-0.5px] text-primary">
            SATHUN GLOBAL
          </Link>

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
              className="flex h-10 items-center gap-1.5 rounded-lg border border-edge px-2.5 text-base font-bold text-content-tertiary hover:text-content-primary"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">
                {language.code.toUpperCase()} · {currency.code}
              </span>
            </button>

            <button
              onClick={toggleScheme}
              aria-label={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary hover:text-content-primary"
            >
              {scheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isSignedIn && (
              <Link
                href="/chat"
                aria-label="Messages"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary hover:text-content-primary"
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary hover:text-error"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">{t.signIn ?? 'Sign in'}</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav row */}
        <nav className="flex gap-1 overflow-x-auto border-t border-edge px-3 py-1.5 md:hidden">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-base font-bold',
                  active ? 'bg-surface-tint text-primary' : 'text-content-tertiary'
                )}
              >
                {t[item.labelKey] ?? item.fallback}
              </Link>
            );
          })}
        </nav>
      </header>

      <Modal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        title={t.general ?? 'Preferences'}
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-md font-bold text-content-primary">
              {t.selectLanguage ?? 'Language'}
            </p>
            <div className="space-y-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-md',
                    l.code === language.code
                      ? 'bg-surface-tint font-bold text-primary'
                      : 'hover:bg-surface-page'
                  )}
                >
                  <span>{l.flag}</span>
                  {l.nativeName}
                </button>
              ))}
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
