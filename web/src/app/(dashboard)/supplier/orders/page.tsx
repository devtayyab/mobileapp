import { Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import {
  SupplierOrdersList,
  type SupplierOrderGroup,
} from '@/components/supplier/SupplierOrdersList';

export const dynamic = 'force-dynamic';

/**
 * Port of mobile `app/supplier/orders.tsx`.
 *
 * Reads `order_items` scoped to the viewer's own `supplier_id` and groups them
 * by `order_id`, so each card shows only the lines this supplier fulfils and
 * "Your Share" is the sum of `order_items.supplier_amount` (the 90% side of the
 * 90/10 split; the 10% lives in `order_items.platform_commission`).
 */
export default async function SupplierOrdersPage() {
  const { user } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) {
    return (
      <div className="space-y-5">
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">Orders</h1>
        <EmptyState
          icon={<Package size={26} />}
          title="No supplier profile yet"
          message="Add your first product to initialize your supplier profile — orders will show up here afterwards."
        />
      </div>
    );
  }

  const { data: items } = await supabase
    .from('order_items')
    .select(
      `id, order_id, product_name, quantity, unit_price, supplier_amount,
       orders (order_number, status, created_at, currency, shipping_address)`
    )
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false });

  type Row = {
    id: string;
    order_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    supplier_amount: number;
    orders: {
      order_number: string;
      status: string;
      created_at: string;
      currency: string;
      shipping_address: Record<string, string> | null;
    } | null;
  };

  const grouped = new Map<string, SupplierOrderGroup>();

  for (const row of (items ?? []) as unknown as Row[]) {
    // Mobile skips rows whose embedded order is unreadable (RLS / deleted).
    if (!row.orders) continue;

    let group = grouped.get(row.order_id);
    if (!group) {
      const address = row.orders.shipping_address;
      const shipTo =
        [address?.city, address?.state].filter(Boolean).join(', ') || address?.country || null;

      group = {
        orderId: row.order_id,
        orderNumber: row.orders.order_number,
        status: row.orders.status,
        createdAt: row.orders.created_at,
        currency: row.orders.currency,
        shipTo,
        items: [],
        payout: 0,
      };
      grouped.set(row.order_id, group);
    }

    group.items.push({
      id: row.id,
      productName: row.product_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      supplierAmount: row.supplier_amount,
    });
    group.payout += Number(row.supplier_amount ?? 0);
  }

  return <SupplierOrdersList orders={Array.from(grouped.values())} />;
}
