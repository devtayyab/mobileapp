'use client';

/**
 * "Manage Business" quick links — port of the `actionGrid` in mobile
 * `app/supplier/dashboard.tsx`, extended with the two destinations the mobile
 * screen only exposed through its slide-out drawer (Reviews, KYC). The drawer
 * itself is intentionally not ported: `DashboardSidebar` is the web navigation.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  FileCheck2,
  Package,
  ShoppingBag,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react';

type QuickLink = { href: string; label: string; hint: string; icon: LucideIcon };

const LINKS: QuickLink[] = [
  { href: '/supplier/products', label: 'Products', hint: 'Catalog & stock', icon: Package },
  { href: '/supplier/orders', label: 'Orders', hint: 'Fulfil & track', icon: ShoppingBag },
  { href: '/supplier/analytics', label: 'Analytics', hint: 'Sales performance', icon: BarChart3 },
  { href: '/supplier/reviews', label: 'Reviews', hint: 'Moderate feedback', icon: Star },
  { href: '/supplier/shipping-rates', label: 'Shipping Rates', hint: 'Per-country rates', icon: Truck },
  { href: '/supplier/kyc', label: 'KYC', hint: 'Verification docs', icon: FileCheck2 },
  {
    href: '/supplier/business-settings',
    label: 'Business Settings',
    hint: 'Profile & payouts',
    icon: Building2,
  },
];

export function ManageBusinessGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {LINKS.map((link, i) => {
        const Icon = link.icon;

        return (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 240,
              damping: 24,
              delay: Math.min(i * 0.05, 0.3),
            }}
            whileHover={{ y: -3 }}
          >
            <Link
              href={link.href}
              className="flex h-full items-center gap-3 rounded-2xl border border-edge bg-surface p-4 transition-colors hover:border-edge-dark hover:shadow-card"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-tint text-primary">
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold text-content-primary">
                  {link.label}
                </span>
                <span className="block truncate text-sm text-content-tertiary">{link.hint}</span>
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
