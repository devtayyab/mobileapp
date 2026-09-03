'use client';

/**
 * Dependency-free monthly revenue columns (plain divs, no charting library).
 * Every column is a real sum of `order_items.supplier_amount` for that calendar
 * month; months with no orders render as an empty track rather than being hidden.
 */

import { motion } from 'framer-motion';
import { formatMoney } from './money';

export type RevenueMonth = { label: string; amount: number };

export function RevenueColumns({
  months,
  currency,
}: {
  months: RevenueMonth[];
  currency: string;
}) {
  const max = Math.max(...months.map((m) => m.amount), 0);

  if (max <= 0) {
    return (
      <p className="px-4 pb-4 text-md text-content-tertiary">
        No revenue recorded in the last {months.length} months.
      </p>
    );
  }

  return (
    <div className="flex items-end gap-2 px-4 pb-4 sm:gap-3">
      {months.map((month, i) => {
        const pct = max > 0 ? (month.amount / max) * 100 : 0;

        return (
          <div key={month.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="truncate text-2xs font-bold text-content-tertiary">
              {month.amount > 0 ? formatMoney(currency, month.amount) : '—'}
            </span>
            <div
              className="flex h-32 w-full items-end overflow-hidden rounded-lg bg-surface-page"
              title={`${month.label}: ${formatMoney(currency, month.amount)}`}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, month.amount > 0 ? 4 : 0)}%` }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 24,
                  delay: Math.min(i * 0.05, 0.3),
                }}
                className="w-full rounded-lg bg-primary"
              />
            </div>
            <span className="truncate text-sm font-bold text-content-tertiary">{month.label}</span>
          </div>
        );
      })}
    </div>
  );
}
