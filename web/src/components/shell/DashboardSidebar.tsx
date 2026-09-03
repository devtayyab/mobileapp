'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Boxes, Building2, ChevronLeft, FileCheck2, Globe2, LayoutDashboard, LifeBuoy,
  LogOut, Menu, MessageSquare, Moon, Package, Receipt, Settings, ShieldCheck, ShoppingBag,
  Star, Store, Sun, Tags, Truck, Users, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/client';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Avatar } from '@/components/ui/Avatar';
import type { Role } from '@/types/database';

type NavItem = { href: string; label: string; icon: React.ElementType };

const SUPPLIER_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Business',
    items: [
      { href: '/supplier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/supplier/products', label: 'Products', icon: Package },
      { href: '/supplier/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/supplier/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/supplier/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    section: 'Setup',
    items: [
      { href: '/supplier/shipping-rates', label: 'Shipping Rates', icon: Truck },
      { href: '/supplier/kyc', label: 'KYC', icon: FileCheck2 },
      { href: '/supplier/business-settings', label: 'Business Settings', icon: Building2 },
    ],
  },
];

const ADMIN_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    section: 'Marketplace',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/suppliers', label: 'Suppliers', icon: Store },
      { href: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { href: '/admin/categories', label: 'Categories', icon: Tags },
      { href: '/admin/countries', label: 'Countries', icon: Globe2 },
      { href: '/admin/couriers', label: 'Couriers', icon: Truck },
      { href: '/admin/payment-settings', label: 'Payments', icon: Wallet },
    ],
  },
  {
    section: 'Support',
    items: [
      { href: '/admin/support', label: 'Tickets', icon: LifeBuoy },
      { href: '/chat', label: 'Chat', icon: MessageSquare },
    ],
  },
];

export function DashboardSidebar({
  role,
  displayName,
  email,
}: {
  role: Role;
  displayName: string | null;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { scheme, toggleScheme } = useAppTheme();
  const [open, setOpen] = useState(false);

  const nav = role === 'admin' ? ADMIN_NAV : SUPPLIER_NAV;

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const content = (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {/* Wordmark stacks above the role chip so the longer brand name doesn't
          overflow the 248px sidebar. */}
      <div className="mb-2 flex flex-col items-start gap-1 px-2 py-1">
        <span className="text-2xl font-extrabold leading-tight tracking-[-0.5px] text-primary">
          SATHUN GLOBAL
        </span>
        <span className="rounded-md bg-surface-tint px-1.5 py-0.5 text-2xs font-extrabold uppercase tracking-[0.5px] text-primary">
          {role}
        </span>
      </div>

      {nav.map((group) => (
        <div key={group.section} className="mb-2">
          <p className="px-2 pb-1 pt-2 text-2xs font-extrabold uppercase tracking-[0.5px] text-content-tertiary">
            {group.section}
          </p>
          {group.items.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-md font-bold transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-content-tertiary hover:bg-surface-page hover:text-content-primary'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-surface-tint"
                  />
                )}
                <Icon size={17} className="relative z-10 shrink-0" />
                <span className="relative z-10 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto space-y-1 border-t border-edge pt-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-md font-bold text-content-tertiary hover:bg-surface-page hover:text-content-primary"
        >
          <Boxes size={17} />
          Back to storefront
        </Link>
        <Link
          href="/profile/settings"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-md font-bold text-content-tertiary hover:bg-surface-page hover:text-content-primary"
        >
          <Settings size={17} />
          Settings
        </Link>
        <button
          onClick={toggleScheme}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-md font-bold text-content-tertiary hover:bg-surface-page hover:text-content-primary"
        >
          {scheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {scheme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="flex items-center gap-2 rounded-lg px-2.5 py-2">
          <Avatar name={displayName ?? email} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-content-primary">
              {displayName ?? 'Account'}
            </p>
            <p className="truncate text-sm text-content-tertiary">{email}</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="text-content-tertiary hover:text-error"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-edge bg-surface px-3 py-2 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-content-tertiary"
        >
          <Menu size={18} />
        </button>
        <span className="text-2xl font-extrabold text-primary">SATHUN GLOBAL</span>
        <span className="ml-auto flex items-center gap-1 text-sm font-bold uppercase text-content-tertiary">
          <ShieldCheck size={14} />
          {role}
        </span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative h-full w-[272px] border-r border-edge bg-surface"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-2 rounded-lg p-1.5 text-content-tertiary"
            >
              <ChevronLeft size={18} />
            </button>
            {content}
          </motion.aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-edge bg-surface lg:block">
        {content}
      </aside>
    </>
  );
}
