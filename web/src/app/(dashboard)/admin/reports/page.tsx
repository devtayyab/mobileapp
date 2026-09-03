import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  RevenueReport,
  type DailyRevenuePoint,
  type RevenueCurrencyRow,
  type RevenueReportData,
  type TopSupplier,
} from '@/components/admin/RevenueReport';
import type { OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

/** Shape returned by the `admin_revenue_report()` RPC (migration 20260903006000). */
type AdminRevenueReport = {
  window_start: string;
  window_end: string;
  total_orders: number | string;
  orders_by_status: { status: string; orders: number | string }[] | null;
  by_currency:
    | {
        currency: string;
        gross_revenue: number | string | null;
        commission: number | string | null;
        orders: number | string;
        avg_order_value: number | string | null;
      }[]
    | null;
  payouts_by_currency:
    | {
        currency: string;
        supplier_payouts: number | string | null;
        item_commission: number | string | null;
      }[]
    | null;
  daily_revenue:
    | { currency: string; day: string; revenue: number | string | null; orders: number | string }[]
    | null;
  top_suppliers:
    | {
        currency: string;
        supplier_id: string | null;
        business_name: string | null;
        revenue: number | string | null;
        orders: number | string;
        rank: number | string;
      }[]
    | null;
};

/** `order_status` enum order — statuses render in lifecycle order, not by rank. */
const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'processing',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const num = (v: number | string | null | undefined) => Number(v ?? 0);

/** Inclusive list of `YYYY-MM-DD` UTC days, so the x-axis has no gaps. */
function utcDayRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime())) return days;

  // Guard against a pathological range; the window is only ever 7 days.
  while (cursor <= last && days.length < 31) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

/** Today and the six days before it, in UTC — matches the RPC's window. */
function fallbackWindow() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);

  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/**
 * Ported from mobile `app/admin/reports.tsx`.
 *
 * Two deliberate departures from the mobile screen:
 *
 * 1. Money is never blended. Mobile sums `orders.total` and
 *    `order_items.*` straight into single figures, but `orders.currency`
 *    varies per row (and `order_items` carries no currency at all), so every
 *    monetary aggregate here is grouped by the parent order's currency —
 *    the same pattern as `admin_platform_stats()`.
 *
 * 2. Aggregation happens in SQL. Mobile fetches unbounded `order_items` /
 *    `orders` selects and reduces them in JS, which PostgREST silently
 *    truncates at its `max-rows` default. The `admin_revenue_report()` RPC
 *    has no such ceiling. When it hasn't been applied yet, the money sections
 *    say so rather than showing a truncated number, and the order counts fall
 *    back to exact `head` counts (which are never truncated).
 *
 * The `(dashboard)` layout only gates on ['supplier','admin'], so this route
 * re-gates on ['admin'] itself.
 */
export default async function AdminReportsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  /*
    `admin_revenue_report` is not in the shared
    `Database['public']['Functions']` union yet (src/types/database.ts is
    shared and off-limits to this change — the needed addition is reported).
    Drop to the untyped client for this one call; the response is validated
    through the `AdminRevenueReport` shape above.
  */
  const rpcClient = supabase as unknown as SupabaseClient;

  const [reportRpc, ordersCountRes] = await Promise.all([
    rpcClient.rpc('admin_revenue_report'),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
  ]);

  const rpc = reportRpc.error ? null : (reportRpc.data as AdminRevenueReport | null);

  /* ── Order counts (currency-free) ─────────────────────────────────────── */

  const rpcStatusCounts = new Map(
    (rpc?.orders_by_status ?? []).map((r) => [r.status, num(r.orders)])
  );

  // Without the RPC, fall back to exact `head` counts — one per status. These
  // are computed server-side by PostgREST, so they are never row-capped.
  const statusCounts = rpc
    ? []
    : await Promise.all(
        STATUS_ORDER.map((status) =>
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', status)
        )
      );

  const ordersByStatus = STATUS_ORDER.map((status, i) => ({
    status,
    orders: rpcStatusCounts.get(status) ?? statusCounts[i]?.count ?? 0,
  })).filter((row) => row.orders > 0);

  const totalOrders = rpc ? num(rpc.total_orders) : (ordersCountRes.count ?? 0);

  /* ── Money, grouped by `orders.currency` ──────────────────────────────── */

  const payoutByCurrency = new Map(
    (rpc?.payouts_by_currency ?? []).map((r) => [r.currency, num(r.supplier_payouts)])
  );

  const currencies: RevenueCurrencyRow[] = (rpc?.by_currency ?? []).map((r) => ({
    currency: r.currency,
    grossRevenue: num(r.gross_revenue),
    commission: num(r.commission),
    orders: num(r.orders),
    avgOrderValue: num(r.avg_order_value),
    supplierPayouts: payoutByCurrency.get(r.currency) ?? 0,
  }));

  /* ── Last 7 days, per currency, zero-filled ───────────────────────────── */

  const fallback = fallbackWindow();
  const windowStart = rpc?.window_start ?? fallback.start;
  const windowEnd = rpc?.window_end ?? fallback.end;
  const windowDays = utcDayRange(windowStart, windowEnd);

  const dailyIndex = new Map<string, Map<string, DailyRevenuePoint>>();
  for (const row of rpc?.daily_revenue ?? []) {
    if (!dailyIndex.has(row.currency)) dailyIndex.set(row.currency, new Map());
    dailyIndex.get(row.currency)!.set(row.day, {
      day: row.day,
      revenue: num(row.revenue),
      orders: num(row.orders),
    });
  }

  // Order the small multiples the same way as the stat cards (revenue desc),
  // so a currency keeps its position across every section of the page.
  const currencyRank = new Map(currencies.map((c, i) => [c.currency, i]));

  const dailyByCurrency = [...dailyIndex.entries()]
    .sort(
      ([a], [b]) =>
        (currencyRank.get(a) ?? Number.MAX_SAFE_INTEGER) -
        (currencyRank.get(b) ?? Number.MAX_SAFE_INTEGER)
    )
    .map(([currency, byDay]) => ({
      currency,
      days: windowDays.map((day) => byDay.get(day) ?? { day, revenue: 0, orders: 0 }),
    }));

  /* ── Top suppliers, ranked within each currency ───────────────────────── */

  const supplierIndex = new Map<string, TopSupplier[]>();
  for (const row of rpc?.top_suppliers ?? []) {
    const group = supplierIndex.get(row.currency) ?? [];
    group.push({
      // The supplier row may have been deleted (ON DELETE SET NULL) — degrade
      // gracefully rather than dropping the payout from the ranking.
      businessName: row.business_name ?? 'Unknown supplier',
      revenue: num(row.revenue),
      orders: num(row.orders),
    });
    supplierIndex.set(row.currency, group);
  }

  const topSuppliersByCurrency = [...supplierIndex.entries()]
    .sort(
      ([a], [b]) =>
        (currencyRank.get(a) ?? Number.MAX_SAFE_INTEGER) -
        (currencyRank.get(b) ?? Number.MAX_SAFE_INTEGER)
    )
    .map(([currency, suppliers]) => ({ currency, suppliers }));

  const data: RevenueReportData = {
    totalOrders,
    ordersByStatus,
    currencies,
    dailyByCurrency,
    topSuppliersByCurrency,
    windowStart,
    windowEnd,
    // Set when the RPC hasn't been applied to the database yet.
    moneyUnavailable: rpc == null,
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Revenue Reports
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          Platform earnings, commission and supplier payouts
        </p>
      </header>

      <RevenueReport data={data} />
    </div>
  );
}
