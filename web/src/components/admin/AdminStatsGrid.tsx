'use client';

import { Activity, DollarSign, FileCheck2, Package, ShoppingBag, Store, TrendingUp, Users } from 'lucide-react';
import { StatCard } from '@/components/ui';

export type RevenueByCurrency = {
  currency: string;
  revenue: number;
  commission: number;
  orders: number;
};

export type PlatformStats = {
  totalUsers: number;
  totalSuppliers: number;
  approvedSuppliers: number;
  pendingKyc: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
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
 * through `useCurrency().formatPrice` (see CONTRIBUTING.md).
 */
const money = (n: number, currency: string) =>
  `${currency} ${Math.round(n).toLocaleString('en-US')}`;

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
        <StatCard label="Total Users" value={stats.totalUsers} icon={<Users size={18} />} />
        <StatCard
          label="Suppliers"
          value={stats.totalSuppliers}
          icon={<Store size={18} />}
          hint={`${stats.approvedSuppliers.toLocaleString()} approved`}
        />
        <StatCard
          label="Products"
          value={stats.totalProducts}
          icon={<Package size={18} />}
          hint={`${stats.activeProducts.toLocaleString()} active`}
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingBag size={18} />}
          hint={`${stats.pendingOrders.toLocaleString()} pending`}
        />
        <StatCard label="Pending KYC" value={stats.pendingKyc} icon={<Activity size={18} />} />
        <StatCard
          label="Approved KYC"
          value={stats.approvedSuppliers}
          icon={<FileCheck2 size={18} />}
        />
      </div>
    </div>
  );
}
