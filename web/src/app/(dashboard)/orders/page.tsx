import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const { user } = await requireRole(['b2b']);
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, subtotal, shipping_fee, vat_amount, total, currency, created_at, order_items (product_name, quantity, unit_price)'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">My Orders</h1>

      <div className="space-y-4">
        {(orders ?? []).map((order) => (
          <div key={order.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-slate-900">#{order.order_number}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {order.status}
              </span>
            </div>
            <p className="mb-2 text-xs text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
            <table className="w-full text-left text-sm">
              <tbody>
                {(order.order_items as unknown as { product_name: string; quantity: number; unit_price: number }[]).map(
                  (item, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-700">{item.product_name}</td>
                      <td className="py-1.5 text-slate-500">x{item.quantity}</td>
                      <td className="py-1.5 text-right text-slate-500">{item.unit_price.toFixed(2)} each</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            <div className="mt-2 flex justify-end text-sm font-semibold text-slate-900">
              Total: {order.currency} {order.total.toFixed(2)}
            </div>
          </div>
        ))}
        {(orders ?? []).length === 0 && <p className="text-sm text-slate-400">No orders yet.</p>}
      </div>
    </div>
  );
}
