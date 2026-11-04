'use client';

import { useState } from 'react';
import {
  Activity,
  Coins,
  DollarSign,
  FileCheck2,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { StatCard } from '@/components/ui';
import { useCurrency, type Currency } from '@/providers/CurrencyProvider';

export type RevenueByCurrency = {
  currency: string;
  revenue: number;
  commission: number;
  orders: number;
};

/**
 * A count that could not be read (the query returned an error, so PostgREST
 * gave back no count) is null — never 0. A tile shows "—" for it rather than
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
   * One entry per orders.currency.
   */
  revenueByCurrency: RevenueByCurrency[];
  /** True when the admin_platform_stats() RPC hasn't been applied yet. */
  revenueUnavailable?: boolean;
};

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

/** StatCard for a count that loaded, UnavailableCard for one that didn't. */
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
  const { currency, currencies, setCurrency } = useCurrency();
  const [showOriginalBreakdown, setShowOriginalBreakdown] = useState(false);

  // Helper to get exchange rate relative to USD (1 USD = X Currency)
  const getRate = (code: string): number => {
    const found = currencies.find((c) => c.code.toUpperCase() === code.toUpperCase());
    return found?.rate && found.rate > 0 ? found.rate : 1;
  };

  // Convert all revenues from their charged currency to the selected admin currency
  const targetRate = currency.rate > 0 ? currency.rate : 1;

  const totalConvertedRevenue = stats.revenueByCurrency.reduce((sum, row) => {
    const originRate = getRate(row.currency);
    const usdAmount = row.revenue / originRate;
    return sum + usdAmount * targetRate;
  }, 0);

  const totalConvertedCommission = stats.revenueByCurrency.reduce((sum, row) => {
    const originRate = getRate(row.currency);
    const usdAmount = row.commission / originRate;
    return sum + usdAmount * targetRate;
  }, 0);

  const totalOrdersCount = stats.revenueByCurrency.reduce((sum, row) => sum + row.orders, 0);

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
        <div className="space-y-3">
          {/* Super Admin Currency Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-edge bg-surface px-4 py-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-tint text-primary">
                <Coins size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-content-primary">
                  Results Currency: <span className="text-primary">{currency.code} ({currency.symbol})</span>
                </p>
                <p className="text-xs text-content-tertiary">
                  Change the currency you see your platform results and revenue in
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={currency.code}
                onChange={(e) => {
                  const selected = currencies.find((c) => c.code === e.target.value);
                  if (selected) setCurrency(selected);
                }}
                aria-label="Select admin view currency"
                className="h-10 rounded-xl border border-edge bg-surface-page px-3 text-sm font-bold text-content-primary transition-colors hover:border-primary focus:border-primary focus:outline-none cursor-pointer"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol}) — {c.name}
                  </option>
                ))}
              </select>

              {stats.revenueByCurrency.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowOriginalBreakdown(!showOriginalBreakdown)}
                  className="h-10 rounded-xl border border-edge px-3 text-xs font-bold text-content-secondary hover:bg-surface-page"
                >
                  {showOriginalBreakdown ? 'Hide Breakdown' : 'Show Original Breakdown'}
                </button>
              )}
            </div>
          </div>

          {/* Primary Revenue and Commission Display in Chosen Currency */}
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label={`Gross Revenue (${currency.code})`}
              value={totalConvertedRevenue}
              format={(n) => money(n, currency.code)}
              icon={<DollarSign size={18} />}
              hint={`${totalOrdersCount.toLocaleString()} order${totalOrdersCount === 1 ? '' : 's'}${currency.code !== 'USD' ? ` · 1 USD = ${currency.rate} ${currency.code}` : ''}`}
            />
            <StatCard
              label={`Commission (${currency.code})`}
              value={totalConvertedCommission}
              format={(n) => money(n, currency.code)}
              icon={<TrendingUp size={18} />}
              hint={`Platform earnings${currency.code !== 'USD' ? ` in ${currency.code}` : ''}`}
            />
          </div>

          {/* Optional Original Charged Currency Breakdown */}
          {showOriginalBreakdown && stats.revenueByCurrency.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-dashed border-edge p-3 bg-surface-page/50">
              <p className="text-xs font-bold uppercase tracking-[0.5px] text-content-tertiary">
                Original Charged Currency Breakdown
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.revenueByCurrency.map((row) => (
                  <div key={row.currency} className="contents">
                    <StatCard
                      label={`Gross Revenue (${row.currency})`}
                      value={row.revenue}
                      format={(n) => money(n, row.currency)}
                      icon={<DollarSign size={18} />}
                      hint={`${row.orders.toLocaleString()} order${row.orders === 1 ? '' : 's'} (charged in ${row.currency})`}
                    />
                    <StatCard
                      label={`Commission (${row.currency})`}
                      value={row.commission}
                      format={(n) => money(n, row.currency)}
                      icon={<TrendingUp size={18} />}
                      hint={`Platform earnings in ${row.currency}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
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
