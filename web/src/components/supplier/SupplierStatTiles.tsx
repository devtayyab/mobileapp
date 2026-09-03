'use client';

/**
 * Stat grid for the supplier dashboard / analytics screens.
 *
 * Wraps the UI-kit `StatCard` (which owns the count-up) in a client boundary so
 * the pages can stay server components: `StatCard.format` is a function prop and
 * a Server Component cannot hand a function to a Client Component.
 */

import {
  Boxes,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { StatCard } from '@/components/ui';
import { formatMoney } from './money';

const ICONS: Record<string, LucideIcon> = {
  revenue: DollarSign,
  orders: ShoppingCart,
  products: Package,
  pending: TrendingUp,
  units: Boxes,
  reviews: Star,
};

export type StatTile = {
  label: string;
  value: number;
  icon: keyof typeof ICONS | (string & {});
  /** Set for money tiles — the currency the amount was actually charged in. */
  currency?: string;
  hint?: string;
};

export function SupplierStatTiles({
  tiles,
  columns = 4,
}: {
  tiles: StatTile[];
  columns?: 3 | 4;
}) {
  return (
    <div
      className={
        columns === 3
          ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
      }
    >
      {tiles.map((tile) => {
        const Icon = ICONS[tile.icon] ?? TrendingUp;
        const currency = tile.currency;

        return (
          <StatCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            hint={tile.hint}
            icon={<Icon size={18} />}
            format={currency ? (n) => formatMoney(currency, n) : undefined}
          />
        );
      })}
    </div>
  );
}
