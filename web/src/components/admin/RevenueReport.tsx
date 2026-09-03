import {
  BarChart3,
  DollarSign,
  Percent,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { StatCard } from '@/components/ui';

/* ────────────────────────────────────────────────────────────────────────────
   Types — one entry per `orders.currency` for every monetary figure.

   `orders.currency` varies per row and `order_items` has no currency column
   of its own, so nothing here is ever collapsed into a single blended total.
   Order *counts* are currency-free and therefore reported ungrouped.
   ──────────────────────────────────────────────────────────────────────── */

export type RevenueCurrencyRow = {
  currency: string;
  /** sum(orders.total) — includes tax + shipping. */
  grossRevenue: number;
  /** sum(orders.platform_commission). */
  commission: number;
  orders: number;
  /** avg(orders.total). */
  avgOrderValue: number;
  /** sum(order_items.supplier_amount) for orders in this currency. */
  supplierPayouts: number;
};

export type DailyRevenuePoint = { day: string; revenue: number; orders: number };

export type TopSupplier = { businessName: string; revenue: number; orders: number };

export type RevenueReportData = {
  totalOrders: number;
  /** In `order_status` lifecycle order; statuses with no orders are omitted. */
  ordersByStatus: { status: string; orders: number }[];
  currencies: RevenueCurrencyRow[];
  dailyByCurrency: { currency: string; days: DailyRevenuePoint[] }[];
  topSuppliersByCurrency: { currency: string; suppliers: TopSupplier[] }[];
  /** Inclusive UTC bounds of the 7-day window, `YYYY-MM-DD`. */
  windowStart: string;
  windowEnd: string;
  /** True when `admin_revenue_report()` hasn't been applied to the DB yet. */
  moneyUnavailable?: boolean;
};

/* ── Formatting ──────────────────────────────────────────────────────────── */

/**
 * Order money is shown in the currency it was stored/charged in — never pushed
 * through `useCurrency().formatPrice` (see CONTRIBUTING.md).
 */
const money = (n: number, currency: string) =>
  `${currency} ${Math.round(n).toLocaleString('en-US')}`;

/**
 * Axis ticks and the single direct label: 12.5k / 1.2m. Full values live in
 * the tooltips and the table view.
 *
 * Small values keep one decimal so a midpoint tick never *mislabels* its
 * gridline (an axis max of 5 has a midpoint of 2.5, not "3").
 */
function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Round the axis maximum up to a clean 1 / 2 / 5 × 10ⁿ step. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
}

const dayLabel = (day: string) => day.slice(5);

/* ── Status vocabulary ───────────────────────────────────────────────────── */

/**
 * `order_status` is a status scale, not a categorical identity scale, so it
 * wears the app's reserved status tokens (the same ones `StatusBadge` uses).
 *
 * Colorblind-safety note: run through the dataviz palette validator these six
 * tokens FAIL adjacent separation (`#1976D2` shipped ↔ `#2196F3` processing is
 * ΔE 9.5 even with normal vision). Colour is therefore never the only channel
 * here — every row carries its status name and its count as visible text, and
 * the table view below repeats both.
 */
const STATUS_BAR: Record<string, string> = {
  pending: 'bg-status-pending',
  processing: 'bg-status-processing',
  confirmed: 'bg-status-processing',
  shipped: 'bg-status-shipped',
  delivered: 'bg-status-delivered',
  cancelled: 'bg-status-cancelled',
  refunded: 'bg-status-refunded',
};

const titleCase = (status: string) =>
  status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/* ── Layout primitives ──────────────────────────────────────────────────── */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <h2 className="text-lg font-bold text-content-primary">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-content-tertiary">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** The WCAG-clean twin of every chart on this page. Values are never tooltip-gated. */
function TableView({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="mt-3 border-t border-edge-light pt-2.5">
      <summary className="cursor-pointer text-sm font-bold text-content-tertiary hover:text-content-primary">
        {label}
      </summary>
      <div className="mt-2 overflow-x-auto">{children}</div>
    </details>
  );
}

const TH = 'px-2 py-1.5 text-left text-xs font-bold uppercase tracking-[0.5px] text-content-tertiary';
const TD = 'px-2 py-1.5 text-md text-content-primary [font-variant-numeric:tabular-nums]';

/* ── Chart: revenue, last 7 days (one small multiple per currency) ───────── */

function DailyRevenueChart({
  currency,
  days,
}: {
  currency: string;
  days: DailyRevenuePoint[];
}) {
  const peak = days.reduce((max, d) => Math.max(max, d.revenue), 0);
  const axisMax = niceMax(peak);
  // Direct-label the extreme only — never a number on every column.
  const peakDay = peak > 0 ? days.find((d) => d.revenue === peak)?.day : undefined;

  return (
    <figure className="m-0">
      <figcaption className="mb-3 text-md font-bold text-content-primary">
        {currency}
        <span className="ml-1.5 font-normal text-content-tertiary">
          gross order value per day
        </span>
      </figcaption>

      <div className="flex gap-2">
        {/*
          Y axis: clean ticks carry the values that aren't directly labelled.
          `mt-[18px] h-[130px]` lines the three ticks up with the three
          gridlines, which start below the label headroom.
        */}
        <div className="mt-[18px] flex h-[130px] w-9 shrink-0 flex-col justify-between text-right text-2xs text-content-tertiary [font-variant-numeric:tabular-nums]">
          <span>{compact(axisMax)}</span>
          <span>{compact(axisMax / 2)}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1">
          {/* 148px = 18px headroom for the direct label + a 130px value scale. */}
          <div className="relative h-[148px]">
            <div className="absolute inset-x-0 bottom-0 top-[18px]">
              {/* Hairline, solid, one step off the surface — never dashed. */}
              <span className="absolute inset-x-0 top-0 h-px bg-edge-light" aria-hidden />
              <span className="absolute inset-x-0 top-1/2 h-px bg-edge-light" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 h-px bg-edge" aria-hidden />

              {/* 2px surface gap separates adjacent columns — no borders on marks. */}
              <div className="absolute inset-0 flex items-end gap-0.5">
                {days.map((day) => {
                  const ratio = axisMax > 0 ? day.revenue / axisMax : 0;
                  const height =
                    day.revenue > 0 ? `max(${(ratio * 100).toFixed(2)}%, 4px)` : '2px';

                  return (
                    <div
                      key={day.day}
                      // Native tooltip: enhances, never the only way to read a value.
                      title={`${dayLabel(day.day)} · ${money(day.revenue, currency)} · ${day.orders} order${day.orders === 1 ? '' : 's'}`}
                      className="relative h-full min-w-0 flex-1"
                    >
                      <span
                        // ≤24px thick, 4px rounded data-end, square at the baseline.
                        className={`absolute bottom-0 left-1/2 w-full max-w-[24px] -translate-x-1/2 rounded-t-[4px] ${
                          day.revenue > 0 ? 'bg-primary' : 'bg-edge'
                        }`}
                        style={{ height }}
                        aria-hidden
                      />
                      {day.day === peakDay && (
                        /*
                          Sits in the headroom above the tallest column, so it
                          can never be clipped by the plot or collide with a
                          neighbour (no other column is labelled). Compact
                          figure only — the currency is in the caption and the
                          exact value is in the tooltip and the table below.
                        */
                        <span
                          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-2xs font-bold text-content-secondary"
                          style={{ bottom: `calc(${height} + 3px)` }}
                        >
                          {compact(day.revenue)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* x-axis band sits outside the fixed plot height, so nothing clips. */}
          <div className="mt-1.5 flex gap-0.5">
            {days.map((day) => (
              <span
                key={day.day}
                className="min-w-0 flex-1 text-center text-2xs text-content-tertiary [font-variant-numeric:tabular-nums]"
              >
                {dayLabel(day.day)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <TableView label={`Show ${currency} daily figures as a table`}>
        <table className="w-full min-w-[280px] border-collapse">
          <thead>
            <tr className="border-b border-edge-light">
              <th className={TH} scope="col">
                Day (UTC)
              </th>
              <th className={TH} scope="col">
                Gross revenue
              </th>
              <th className={TH} scope="col">
                Orders
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.day} className="border-b border-edge-light last:border-0">
                <th scope="row" className={`${TD} font-bold`}>
                  {day.day}
                </th>
                <td className={TD}>{money(day.revenue, currency)}</td>
                <td className={TD}>{day.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableView>
    </figure>
  );
}

/* ── Chart: orders by status ─────────────────────────────────────────────── */

function OrdersByStatusChart({
  rows,
  total,
}: {
  rows: { status: string; orders: number }[];
  total: number;
}) {
  // Bars are scaled to the total, not to the largest status, so a bar's length
  // and the percentage printed beside it always say the same thing (mobile
  // scales to the total too).
  const scale = total > 0 ? total : 1;

  return (
    <figure className="m-0">
      {/* Wide content scrolls in its own container rather than collapsing the bars. */}
      <ul className="space-y-2.5 overflow-x-auto">
        {rows.map((row) => {
          const share = total > 0 ? (row.orders / total) * 100 : 0;

          return (
            <li
              key={row.status}
              className="flex min-w-[280px] items-center gap-3"
              title={`${titleCase(row.status)} · ${row.orders} of ${total} order${total === 1 ? '' : 's'} (${share.toFixed(1)}%)`}
            >
              <span className="w-24 shrink-0 truncate text-md text-content-primary">
                {titleCase(row.status)}
              </span>
              <span className="w-9 shrink-0 text-right text-md font-bold text-content-primary [font-variant-numeric:tabular-nums]">
                {row.orders}
              </span>
              <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-surface-page">
                <span
                  className={`absolute inset-y-0 left-0 rounded-r-[4px] ${
                    STATUS_BAR[row.status] ?? 'bg-primary'
                  }`}
                  style={{ width: `max(${((row.orders / scale) * 100).toFixed(2)}%, 2px)` }}
                  aria-hidden
                />
              </span>
              <span className="w-12 shrink-0 text-right text-sm text-content-tertiary [font-variant-numeric:tabular-nums]">
                {share.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>

      <TableView label="Show order statuses as a table">
        <table className="w-full min-w-[280px] border-collapse">
          <thead>
            <tr className="border-b border-edge-light">
              <th className={TH} scope="col">
                Status
              </th>
              <th className={TH} scope="col">
                Orders
              </th>
              <th className={TH} scope="col">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.status} className="border-b border-edge-light last:border-0">
                <th scope="row" className={`${TD} font-bold`}>
                  {titleCase(row.status)}
                </th>
                <td className={TD}>{row.orders}</td>
                <td className={TD}>
                  {total > 0 ? `${((row.orders / total) * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableView>
    </figure>
  );
}

/* ── Chart: top suppliers (ranked within one currency) ───────────────────── */

function TopSuppliersChart({
  currency,
  suppliers,
}: {
  currency: string;
  suppliers: TopSupplier[];
}) {
  const axisMax = suppliers.reduce((max, s) => Math.max(max, s.revenue), 0) || 1;

  return (
    <figure className="m-0">
      <figcaption className="mb-3 text-md font-bold text-content-primary">
        {currency}
        <span className="ml-1.5 font-normal text-content-tertiary">
          supplier payouts, top {suppliers.length}
        </span>
      </figcaption>

      <ol className="space-y-2.5 overflow-x-auto">
        {suppliers.map((supplier, index) => (
          <li
            key={`${supplier.businessName}-${index}`}
            className="flex min-w-[280px] items-center gap-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-3xl bg-surface-tint text-base font-bold text-primary">
              {index + 1}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-md font-bold text-content-primary">
                {supplier.businessName}
              </span>
              <span className="mt-1 flex items-center gap-2">
                <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-surface-page">
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-[4px] bg-primary"
                    style={{
                      width: `max(${((supplier.revenue / axisMax) * 100).toFixed(2)}%, 2px)`,
                    }}
                    aria-hidden
                  />
                </span>
                <span className="shrink-0 text-sm text-content-tertiary [font-variant-numeric:tabular-nums]">
                  {supplier.orders} order{supplier.orders === 1 ? '' : 's'}
                </span>
              </span>
            </span>

            <span className="shrink-0 text-lg font-extrabold text-success [font-variant-numeric:tabular-nums]">
              {money(supplier.revenue, currency)}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/* ── The report ──────────────────────────────────────────────────────────── */

export function RevenueReport({ data }: { data: RevenueReportData }) {
  const {
    totalOrders,
    ordersByStatus,
    currencies,
    dailyByCurrency,
    topSuppliersByCurrency,
    windowStart,
    windowEnd,
    moneyUnavailable,
  } = data;

  const multiCurrency = currencies.length > 1;

  return (
    <div className="space-y-4">
      {multiCurrency && (
        <p className="rounded-xl border border-edge bg-surface-tint px-4 py-2.5 text-sm text-content-secondary">
          Orders were charged in {currencies.length} currencies (
          {currencies.map((c) => c.currency).join(', ')}). Every monetary figure below is
          reported per currency and never summed across them.
        </p>
      )}

      {moneyUnavailable ? (
        <div className="rounded-2xl border border-warning bg-surface-tint p-4">
          <p className="text-md font-bold text-warning">Revenue figures unavailable</p>
          <p className="mt-0.5 text-sm text-content-tertiary">
            Apply migration{' '}
            <code className="font-mono">20260903006000_add_admin_revenue_report_rpc.sql</code> to
            enable accurate, per-currency revenue, commission, payout and supplier figures. Order
            counts below are exact and unaffected.
          </p>
        </div>
      ) : currencies.length === 0 ? (
        <div className="rounded-2xl border border-edge bg-surface p-4">
          <p className="text-md font-bold text-content-primary">No revenue yet</p>
          <p className="mt-0.5 text-sm text-content-tertiary">
            Figures appear here once the first order is placed.
          </p>
        </div>
      ) : (
        <>
          {currencies.map((row) => (
            <section key={row.currency} className="space-y-3">
              {multiCurrency && (
                <h2 className="text-sm font-bold uppercase tracking-[1px] text-content-tertiary">
                  {row.currency}
                </h2>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  label={`Gross Revenue (${row.currency})`}
                  value={row.grossRevenue}
                  format={(n) => money(n, row.currency)}
                  icon={<DollarSign size={18} />}
                  hint="Order totals, incl. tax & shipping"
                />
                <StatCard
                  label={`Platform Commission (${row.currency})`}
                  value={row.commission}
                  format={(n) => money(n, row.currency)}
                  icon={<Percent size={18} />}
                  hint="Platform earnings"
                />
                <StatCard
                  label={`Supplier Payouts (${row.currency})`}
                  value={row.supplierPayouts}
                  format={(n) => money(n, row.currency)}
                  icon={<Users size={18} />}
                  hint="Sum of order item supplier amounts"
                />
                <StatCard
                  label={`Orders (${row.currency})`}
                  value={row.orders}
                  icon={<ShoppingBag size={18} />}
                />
                <StatCard
                  label={`Avg. Order Value (${row.currency})`}
                  value={row.avgOrderValue}
                  format={(n) => money(n, row.currency)}
                  icon={<TrendingUp size={18} />}
                />
              </div>
            </section>
          ))}
        </>
      )}

      <Section
        title="Revenue — last 7 days"
        subtitle={`${windowStart} to ${windowEnd} (UTC), by order currency`}
      >
        {moneyUnavailable || dailyByCurrency.length === 0 ? (
          <p className="py-6 text-center text-md text-content-tertiary">
            {moneyUnavailable
              ? 'Apply the migration above to chart daily revenue.'
              : 'No orders were placed in the last 7 days.'}
          </p>
        ) : (
          <div className={`grid gap-6 ${dailyByCurrency.length > 1 ? 'xl:grid-cols-2' : ''}`}>
            {dailyByCurrency.map((series) => (
              <DailyRevenueChart
                key={series.currency}
                currency={series.currency}
                days={series.days}
              />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Orders by status"
        subtitle={`${totalOrders.toLocaleString()} order${totalOrders === 1 ? '' : 's'} in total · counts are currency-independent`}
      >
        {ordersByStatus.length === 0 ? (
          <p className="py-6 text-center text-md text-content-tertiary">No orders yet.</p>
        ) : (
          <OrdersByStatusChart rows={ordersByStatus} total={totalOrders} />
        )}
      </Section>

      <Section
        title="Top suppliers"
        subtitle="Ranked by payout within each currency — never across currencies"
      >
        {moneyUnavailable || topSuppliersByCurrency.length === 0 ? (
          <p className="py-6 text-center text-md text-content-tertiary">
            {moneyUnavailable ? (
              'Apply the migration above to rank suppliers by payout.'
            ) : (
              <span className="inline-flex items-center gap-2">
                <Store size={16} />
                No supplier sales recorded yet.
              </span>
            )}
          </p>
        ) : (
          <div className={`grid gap-6 ${topSuppliersByCurrency.length > 1 ? 'xl:grid-cols-2' : ''}`}>
            {topSuppliersByCurrency.map((group) => (
              <TopSuppliersChart
                key={group.currency}
                currency={group.currency}
                suppliers={group.suppliers}
              />
            ))}
          </div>
        )}
      </Section>

      <p className="flex items-start gap-2 text-sm text-content-tertiary">
        <BarChart3 size={14} className="mt-0.5 shrink-0" />
        <span>
          All figures are aggregated in SQL by <code className="font-mono">admin_revenue_report()</code>,
          so no total is capped by a row limit. Amounts are shown in the currency each order was
          charged in and are never converted or blended.
        </span>
      </p>
    </div>
  );
}
