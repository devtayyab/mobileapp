'use client';

/** Horizontal share-of-total bars (plain divs — no charting dependency). */

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export type MetricBarRow = {
  key: string;
  label: string;
  value: number;
  /** What to print on the right; defaults to the raw value. */
  display?: string;
  /** Tailwind background class for the bar, e.g. `bg-status-pending`. */
  barClassName?: string;
};

export function MetricBars({
  rows,
  emptyMessage,
}: {
  rows: MetricBarRow[];
  emptyMessage: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 0);

  if (rows.length === 0 || max <= 0) {
    return <p className="px-4 pb-4 text-md text-content-tertiary">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-3 px-4 pb-4">
      {rows.map((row, i) => (
        <li key={row.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-md font-bold capitalize text-content-primary">
              {row.label}
            </span>
            <span className="shrink-0 text-md font-extrabold text-content-primary">
              {row.display ?? row.value.toLocaleString('en-US')}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-pill bg-surface-page">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(row.value / max) * 100}%` }}
              transition={{
                type: 'spring',
                stiffness: 240,
                damping: 24,
                delay: Math.min(i * 0.05, 0.3),
              }}
              className={cn('h-full rounded-pill bg-primary', row.barClassName)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
