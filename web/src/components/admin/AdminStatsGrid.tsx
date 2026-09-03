'use client';

import { Activity, DollarSign, FileCheck2, Package, ShoppingBag, Store, TrendingUp, Users } from 'lucide-react';
import { StatCard } from '@/components/ui';

export type RevenueByCurrency = {
  currency: string;
  revenue: number;
  commission: number;
  orders: number;
};

/**
 * A count that could not be read (the query returned an error, so PostgREST
 * gave back no count) is `null` — never 0. A tile shows "—" for it rather than
 * asserting there are zero users / orders / products.
 */
export type MaybeCount = number | null;

export type PlatformStats = {
  totalUsers: MaybeCount;
  totalSuppliers: MaybeCount;
  approvedSuppliers: MaybeCount;
  pendingKyc: MaybeCount;
  totalProducts: MaybeCount;
  activeProducts: MaybeCount;
  totalOrders: MaybeCount;
  pendingOrders: MaybeCount;
  /**
   * One entry per `orders.currency`. Deliberately NOT collapsed into a single
   * figure: the rows are in different currencies, so a blended sum would be
   * a meaningless number.
   */
  revenueByCurrency: RevenueByCurrency[];
  /** True when the admin_platform_stats() RPC hasn't been applied yet. */
  revenueUnavailable?: boolean;
};

/**
 * Order money is shown in the currency it was stored/charged in — never pushed
 * through `useCurrency().formatPrice` (see CONTRIBUTING.md) — and always to the
 * cent: rounding `USD 1234.56` to `USD 1,235` reports money that was never
 * charged. Same formatting as `components/supplier/money.ts`.
 */
const money = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** "1,204", or "unavailable" when the count could not be read. */
const countText = (n: MaybeCount) => (n == null ? 'unavailable' : n.toLocaleString());

/** A tile whose count failed to load: an em dash, never a fabricated 0. */
function UnavailableCard({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-[0.5px] text-content-tertiary">
          {label}
        </span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-tint text-content-tertiary">
            {icon}
          </span>
        )}
      </div>
      <p className="text-6xl font-extrabold tracking-[-0.5px] text-content-tertiary">&mdash;</p>
      <p className="mt-1 text-sm text-content-tertiary">Count unavailable</p>
    </div>
  );
}

/** `StatCard` for a count that loaded, `UnavailableCard` for one that didn't. */
function CountCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: MaybeCount;
  icon?: React.ReactNode;
  hint?: string;
}) {
  if (value == null) return <UnavailableCard label={label} icon={icon} />;
  return <StatCard label={label} value={value} icon={icon} hint={hint} />;
}

export function AdminStatsGrid({ stats }: { stats: PlatformStats }) {
  return (
    <div className="space-y-3">
      {stats.revenueUnavailable ? (
        <div className="rounded-2xl border border-warning bg-surface-tint p-4">
          <p className="text-md font-bold text-warning">Revenue figures unavailable</p>
          <p className="mt-0.5 text-sm text-content-tertiary">
            Apply migration{' '}
            <code className="font-mono">20260903001000_add_admin_platform_stats_rpc.sql</code> to
            enable accurate, per-currency revenue totals.
          </p>
        </div>
      ) : stats.revenueByCurrency.length === 0 ? (
        <div className="rounded-2xl border border-edge bg-surface p-4">
          <p className="text-md font-bold text-content-primary">No revenue yet</p>
          <p className="mt-0.5 text-sm text-content-tertiary">
            Totals appear here once the first order is placed.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.revenueByCurrency.map((row) => (
            <div key={row.currency} className="contents">
              <StatCard
                label={`Gross Revenue (${row.currency})`}
                value={row.revenue}
                format={(n) => money(n, row.currency)}
                icon={<DollarSign size={18} />}
                hint={`${row.orders.toLocaleString()} order${row.orders === 1 ? '' : 's'}`}
              />
              <StatCard
                label={`Commission (${row.currency})`}
                value={row.commission}
                format={(n) => money(n, row.currency)}
                icon={<TrendingUp size={18} />}
                hint="Platform earnings"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CountCard label="Total Users" value={stats.totalUsers} icon={<Users size={18} />} />
        <CountCard
          label="Suppliers"
          value={stats.totalSuppliers}
          icon={<Store size={18} />}
          hint={`${countText(stats.approvedSuppliers)} approved`}
        />
        <CountCard
          label="Products"
          value={stats.totalProducts}
          icon={<Package size={18} />}
          hint={`${countText(stats.activeProducts)} active`}
        />
        <CountCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingBag size={18} />}
          hint={`${countText(stats.pendingOrders)} pending`}
        />
        <CountCard label="Pending KYC" value={stats.pendingKyc} icon={<Activity size={18} />} />
        <CountCard
          label="Approved KYC"
          value={stats.approvedSuppliers}
          icon={<FileCheck2 size={18} />}
        />
      </div>
    </div>
  );
}
