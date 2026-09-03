import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SupplierOrdersPage() {
  const { user } = await requireRole(['supplier']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) {
    return (
      <div>
        <h1 className="mb-2 text-lg font-semibold text-slate-900">My Orders</h1>
        <p className="text-sm text-slate-500">No supplier profile yet.</p>
      </div>
    );
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('id, order_id, product_name, quantity, unit_price, supplier_amount, orders(order_number, status, created_at)')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false });

  const grouped = new Map<
    string,
    {
      orderNumber: string;
      status: string;
      createdAt: string;
      items: { productName: string; quantity: number; unitPrice: number; supplierAmount: number }[];
    }
  >();

  for (const row of items ?? []) {
    const order = row.orders as unknown as { order_number: string; status: string; created_at: string } | null;
    if (!order) continue;

    const entry = grouped.get(row.order_id) ?? {
      orderNumber: order.order_number,
      status: order.status,
      createdAt: order.created_at,
      items: [],
    };
    entry.items.push({
      productName: row.product_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      supplierAmount: row.supplier_amount,
    });
    grouped.set(row.order_id, entry);
  }

  const orders = Array.from(grouped.values());

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.orderNumber} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-slate-900">#{order.orderNumber}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {order.status}
              </span>
            </div>
            <p className="mb-2 text-xs text-slate-400">
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <table className="w-full text-left text-sm">
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-700">{item.productName}</td>
                    <td className="py-1.5 text-slate-500">x{item.quantity}</td>
                    <td className="py-1.5 text-right text-slate-500">
                      {item.unitPrice.toFixed(2)} each
                    </td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {item.supplierAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-sm text-slate-400">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
