import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  AdminOrdersTable,
  type AdminOrderLine,
  type AdminOrderRow,
} from '@/components/admin/AdminOrdersTable';

export const dynamic = 'force-dynamic';

/** Matches mobile's `.limit(200)` on app/admin/orders.tsx. */
const WINDOW = 200;

/**
 * Ported from mobile `app/admin/orders.tsx`.
 *
 * The `(dashboard)` layout only gates on ['supplier','admin'], so this route
 * re-gates on ['admin'] itself.
 *
 * Mobile fetches customers and line items through PostgREST embeds
 * (`profiles!orders_user_id_fkey`, `order_items`). The hand-written `Database`
 * type declares `Relationships: []`, so embeds are not expressible in its
 * column unions — the joins are done as two extra `.in()` queries and stitched
 * in JS instead. Admins have SELECT on orders, order_items and profiles
 * (migration 20260221081011), so nothing is lost.
 */
export default async function AdminOrdersPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const [ordersRes, totalRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_number, status, subtotal, total, platform_commission, currency, created_at, user_id'
      )
      .order('created_at', { ascending: false })
      .limit(WINDOW),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
  ]);

  const orders = ordersRes.data ?? [];
  const orderIds = orders.map((o) => o.id);
  const userIds = Array.from(new Set(orders.map((o) => o.user_id).filter(Boolean)));

  const [profilesRes, itemsRes] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({
          data: [] as { id: string; full_name: string | null; email: string }[],
          error: null,
        }),
    orderIds.length
      ? supabase
          .from('order_items')
          .select('order_id, product_name, quantity, unit_price')
          .in('order_id', orderIds)
      : Promise.resolve({
          data: [] as {
            order_id: string;
            product_name: string;
            quantity: number;
            unit_price: number;
          }[],
          error: null,
        }),
  ]);

  /*
   * A failed read resolves with `data: null`, which used to fall through to the
   * table's "No orders have been placed yet." empty state — indistinguishable
   * from an account that genuinely has no orders. Surface it instead. Same
   * pattern as `admin/categories/page.tsx`.
   */
  const loadError =
    ordersRes.error?.message ??
    totalRes.error?.message ??
    profilesRes.error?.message ??
    itemsRes.error?.message ??
    null;

  const customerById = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
  );

  const linesByOrder = new Map<string, AdminOrderLine[]>();
  for (const line of itemsRes.data ?? []) {
    const list = linesByOrder.get(line.order_id) ?? [];
    list.push({
      product_name: line.product_name,
      quantity: line.quantity,
      unit_price: line.unit_price,
    });
    linesByOrder.set(line.order_id, list);
  }

  const rows: AdminOrderRow[] = orders.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    subtotal: o.subtotal ?? 0,
    total: o.total ?? 0,
    platform_commission: o.platform_commission ?? 0,
    currency: o.currency,
    created_at: o.created_at,
    customer: customerById.get(o.user_id) ?? null,
    items: linesByOrder.get(o.id) ?? [],
  }));

  const total = totalRes.count ?? rows.length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
          Order Monitoring
        </h1>
        <p className="mt-0.5 text-base text-content-tertiary">
          {total.toLocaleString()} order{total === 1 ? '' : 's'}
          {total > rows.length ? ` · showing the ${WINDOW} most recent` : ''}
        </p>
      </header>

      {loadError && (
        <p className="rounded-xl border border-error bg-surface-tint p-3.5 text-md font-bold text-error">
          Could not load orders: {loadError}
        </p>
      )}

      <AdminOrdersTable initialOrders={rows} totalOrders={total} />
    </div>
  );
}
