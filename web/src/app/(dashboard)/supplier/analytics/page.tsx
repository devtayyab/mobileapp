/**
 * Supplier analytics — port of mobile `app/supplier/analytics.tsx`
 * (revenue / order / product / pending tiles + "Top Performing Products").
 *
 * The mobile screen filters cancelled orders out server-side with
 * `.neq('orders.status', 'cancelled')`; here the items are fetched once and the
 * cancelled/refunded filter is applied in `order-metrics.ts`, so the same rows
 * can also feed the month and status breakdowns.
 *
 * Charts are plain divs (see `RevenueColumns` / `MetricBars`) — no charting
 * dependency was added.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { Card, CardHeader } from '@/components/ui';
import { MetricBars } from '@/components/supplier/MetricBars';
import { NoSupplierProfile } from '@/components/supplier/NoSupplierProfile';
import { RevenueColumns } from '@/components/supplier/RevenueColumns';
import { SupplierStatTiles } from '@/components/supplier/SupplierStatTiles';
import { TopProductsList } from '@/components/supplier/TopProductsList';
import { extraMoneyHint, formatMoney, primaryMoney } from '@/components/supplier/money';
import {
  SUPPLIER_ORDER_ITEM_SELECT,
  groupByOrder,
  isCancelled,
  monthlyRevenue,
  revenueBag,
  statusCounts,
  topProducts,
  type SupplierOrderItem,
} from '@/components/supplier/order-metrics';

export const dynamic = 'force-dynamic';

const ITEM_SCAN_LIMIT = 2000;
const MONTHS = 6;

const STATUS_BARS: Record<string, string> = {
  pending: 'bg-status-pending',
  processing: 'bg-status-processing',
  confirmed: 'bg-status-processing',
  shipped: 'bg-status-shipped',
  delivered: 'bg-status-delivered',
  cancelled: 'bg-status-cancelled',
  refunded: 'bg-status-refunded',
};

export default async function SupplierAnalyticsPage() {
  const { user } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) return <NoSupplierProfile title="Analytics" />;

  const [productsRes, itemsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id),
    supabase
      .from('order_items')
      .select(SUPPLIER_ORDER_ITEM_SELECT)
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(ITEM_SCAN_LIMIT),
  ]);

  const items = (itemsRes.data ?? []) as unknown as SupplierOrderItem[];
  const orders = groupByOrder(items);
  const revenue = revenueBag(items);
  const primaryRevenue = primaryMoney(revenue);
  const revenueHint = extraMoneyHint(revenue);

  const earningOrders = orders.filter((o) => !isCancelled(o.status));
  const unitsSold = items
    .filter((row) => row.orders && !isCancelled(row.orders.status))
    .reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

  const avgOrderValue = (() => {
    const inPrimary = earningOrders.filter((o) => o.currency === primaryRevenue.currency);
    if (inPrimary.length === 0) return 0;
    return (
      inPrimary.reduce((sum, o) => sum + o.supplierAmount, 0) / inPrimary.length
    );
  })();

  const months = monthlyRevenue(items, primaryRevenue.currency, MONTHS);
  const statuses = statusCounts(orders);
  const best = topProducts(items, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          Analytics
        </h1>
        <p className="mt-0.5 text-md text-content-tertiary">
          Your share of every order, cancelled and refunded orders excluded.
          {Object.keys(revenue).length > 1 &&
            ' Amounts are grouped by the currency each order was charged in.'}
        </p>
      </div>

      <SupplierStatTiles
        tiles={[
          {
            label: 'Revenue',
            value: primaryRevenue.amount,
            icon: 'revenue',
            currency: primaryRevenue.currency,
            hint: revenueHint ?? 'Your 90% share of item subtotals',
          },
          {
            label: 'Orders',
            value: earningOrders.length,
            icon: 'orders',
            hint:
              orders.length === earningOrders.length
                ? 'Distinct orders with your products'
                : `${orders.length - earningOrders.length} more cancelled or refunded`,
          },
          {
            label: 'Units sold',
            value: unitsSold,
            icon: 'units',
            hint: 'Across all your products',
          },
          {
            label: 'Products',
            value: productsRes.count ?? 0,
            icon: 'products',
            hint: 'In your catalog',
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={`Revenue · last ${MONTHS} months`}
            subtitle={
              avgOrderValue > 0
                ? `Average ${formatMoney(primaryRevenue.currency, avgOrderValue)} per order`
                : `In ${primaryRevenue.currency}`
            }
          />
          <RevenueColumns months={months} currency={primaryRevenue.currency} />
        </Card>

        <Card>
          <CardHeader title="Orders by status" subtitle="Distinct orders containing your products" />
          <MetricBars
            rows={statuses.map((s) => ({
              key: s.status,
              label: s.status.replace(/_/g, ' '),
              value: s.count,
              barClassName: STATUS_BARS[s.status],
            }))}
            emptyMessage="No orders yet."
          />
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-content-primary">Top Performing Products</h2>
        {best.length === 0 ? (
          // TopProductsList renders its own bordered EmptyState — don't box it twice.
          <TopProductsList products={best} />
        ) : (
          <Card>
            <TopProductsList products={best} />
          </Card>
        )}
      </section>
    </div>
  );
}
