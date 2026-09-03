'use client';

/**
 * "Top Performing Products" — port of the section in mobile
 * `app/supplier/analytics.tsx`: rank chip, product name, units sold, revenue.
 * The share bar is web-only chrome and is derived from the revenue values, not
 * invented.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { formatMoney } from './money';

export type TopProduct = {
  productId: string | null;
  name: string;
  units: number;
  /** Revenue in `currency`; products sold in several currencies are split into a row each. */
  revenue: number;
  currency: string;
};

export function TopProductsList({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<BarChart2 size={26} />}
        title="No sales data yet"
        message="Once your products start selling, your best sellers will be ranked here."
      />
    );
  }

  const max = Math.max(...products.map((p) => p.revenue), 0);

  return (
    <ul className="flex flex-col">
      {products.map((product, i) => {
        const pct = max > 0 ? (product.revenue / max) * 100 : 0;

        const body = (
          <>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-surface-tint text-base font-extrabold text-content-secondary">
              {i + 1}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-bold text-content-primary">
                {product.name}
              </span>
              <span className="mt-1 block text-sm text-content-tertiary">
                {product.units.toLocaleString('en-US')} {product.units === 1 ? 'unit' : 'units'} sold
              </span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-pill bg-surface-page">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 240,
                    damping: 24,
                    delay: Math.min(i * 0.05, 0.3),
                  }}
                  className="block h-full rounded-pill bg-secondary"
                />
              </span>
            </span>

            <span className="shrink-0 text-lg font-extrabold text-secondary">
              {formatMoney(product.currency, product.revenue)}
            </span>
          </>
        );

        return (
          <motion.li
            key={`${product.productId ?? product.name}-${product.currency}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 240,
              damping: 24,
              delay: Math.min(i * 0.05, 0.3),
            }}
            className="border-b border-edge-light last:border-b-0"
          >
            {product.productId ? (
              <Link
                href={`/supplier/products/${product.productId}/edit`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-page"
              >
                {body}
              </Link>
            ) : (
              <span className="flex items-center gap-3 px-4 py-3.5">{body}</span>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}
