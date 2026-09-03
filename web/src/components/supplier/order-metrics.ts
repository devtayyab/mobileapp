/**
 * Pure aggregation over the supplier's `order_items` rows.
 *
 * Supplier orders are only reachable through `order_items` (RLS policy
 * "Suppliers can view their order items", migration 20260115171343): select the
 * items by `supplier_id`, embed the parent `orders`, then group by `order_id`
 * client-side — exactly what the mobile screens do.
 *
 * Money stays per-currency (see `money.ts`): `order_items` has no currency
 * column, the amount is denominated in its parent `orders.currency`.
 */

import { addMoney, type MoneyBag } from './money';

/** Shape of one row of the shared select used by the dashboard + analytics pages. */
export type SupplierOrderItem = {
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  supplier_amount: number;
  orders: {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    currency: string | null;
  } | null;
};

export const SUPPLIER_ORDER_ITEM_SELECT =
  'order_id, product_id, product_name, quantity, supplier_amount, orders!inner (id, order_number, status, created_at, currency)';

export type SupplierOrderGroup = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  currency: string;
  supplierAmount: number;
  itemCount: number;
  units: number;
};

/** One entry per distinct `order_id`, newest first. */
export function groupByOrder(rows: SupplierOrderItem[]): SupplierOrderGroup[] {
  const grouped = new Map<string, SupplierOrderGroup>();

  for (const row of rows) {
    const order = row.orders;
    if (!order) continue;

    const entry =
      grouped.get(row.order_id) ??
      ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        createdAt: order.created_at,
        currency: (order.currency ?? 'USD').toUpperCase(),
        supplierAmount: 0,
        itemCount: 0,
        units: 0,
      } satisfies SupplierOrderGroup);

    entry.supplierAmount += Number(row.supplier_amount) || 0;
    entry.itemCount += 1;
    entry.units += Number(row.quantity) || 0;
    grouped.set(row.order_id, entry);
  }

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function isCancelled(status: string) {
  return status === 'cancelled' || status === 'refunded';
}

/** Revenue per currency. Cancelled/refunded orders are excluded from earnings. */
export function revenueBag(rows: SupplierOrderItem[]): MoneyBag {
  const bag: MoneyBag = {};

  for (const row of rows) {
    const order = row.orders;
    if (!order || isCancelled(order.status)) continue;
    addMoney(bag, order.currency, Number(row.supplier_amount) || 0);
  }

  return bag;
}

export type ProductSales = {
  productId: string | null;
  name: string;
  units: number;
  revenue: number;
  currency: string;
};

/**
 * Best sellers by supplier revenue. Keyed by product *and* currency so a product
 * sold in two currencies is never summed into a meaningless total.
 */
export function topProducts(rows: SupplierOrderItem[], limit = 5): ProductSales[] {
  const byProduct = new Map<string, ProductSales>();

  for (const row of rows) {
    const order = row.orders;
    if (!order || isCancelled(order.status)) continue;

    const currency = (order.currency ?? 'USD').toUpperCase();
    const key = `${row.product_id ?? row.product_name}|${currency}`;

    const entry =
      byProduct.get(key) ??
      ({
        productId: row.product_id,
        // `order_items.product_name` is the NOT NULL snapshot taken at checkout,
        // so it survives a deleted product (product_id is ON DELETE SET NULL).
        name: row.product_name,
        units: 0,
        revenue: 0,
        currency,
      } satisfies ProductSales);

    entry.units += Number(row.quantity) || 0;
    entry.revenue += Number(row.supplier_amount) || 0;
    byProduct.set(key, entry);
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Distinct-order counts per `order_status` value present, largest first. */
export function statusCounts(orders: SupplierOrderGroup[]): { status: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const order of orders) counts.set(order.status, (counts.get(order.status) ?? 0) + 1);

  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Revenue for the trailing `count` calendar months (oldest first) in a single
 * currency — mixing currencies on one axis would be a fabricated figure.
 */
export function monthlyRevenue(
  rows: SupplierOrderItem[],
  currency: string,
  count = 6
): { label: string; amount: number }[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  const keys: { key: string; label: string }[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    keys.push({ key, label: d.toLocaleDateString('en-US', { month: 'short' }) });
    buckets.set(key, 0);
  }

  for (const row of rows) {
    const order = row.orders;
    if (!order || isCancelled(order.status)) continue;
    if ((order.currency ?? 'USD').toUpperCase() !== currency) continue;

    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + (Number(row.supplier_amount) || 0));
  }

  return keys.map(({ key, label }) => ({ label, amount: buckets.get(key) ?? 0 }));
}
