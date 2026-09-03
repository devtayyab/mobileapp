import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { OrderDetailView } from '@/components/orders/OrderDetailView';
import type { OrderDetail } from '@/components/orders/types';

export const dynamic = 'force-dynamic';

/**
 * Web-only route: mobile renders this as a modal over the orders tab.
 * `shipments.courier_id` -> `couriers` is the real courier source; the legacy
 * `carrier` text column is kept as a fallback inside OrderDetailView.
 */
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireRole(['customer', 'b2b', 'supplier', 'admin']);
  const supabase = await createClient();

  const { data } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, subtotal, shipping_fee, vat_amount, tax, total, currency,
       created_at, shipping_address,
       order_items (product_name, quantity, unit_price, subtotal),
       shipments (
         tracking_number, carrier, status, estimated_delivery, shipped_at, delivered_at,
         courier_id, couriers (name, code, tracking_url_format)
       ),
       countries (name, code, vat_type)`
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) notFound();

  return <OrderDetailView order={data as unknown as OrderDetail} />;
}
