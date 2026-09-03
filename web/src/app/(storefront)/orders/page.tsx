import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { OrderHistoryList } from '@/components/orders/OrderHistoryList';
import type { OrderSummary } from '@/components/orders/types';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const { user } = await requireRole(['customer', 'b2b', 'supplier', 'admin']);
  const supabase = await createClient();

  const { data } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, total, currency, created_at,
       order_items (product_name, quantity, unit_price, subtotal)`
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const orders = (data as unknown as OrderSummary[]) ?? [];

  return <OrderHistoryList orders={orders} />;
}
