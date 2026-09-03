import Link from 'next/link';
import { ArrowLeft, Globe, MapPin, Package, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { EmptyState, StatusBadge } from '@/components/ui';
import { ShipmentForm, type ShipmentCourier, type SupplierShipment } from '@/components/supplier/ShipmentForm';
import { formatOrderAmount } from '@/components/orders/types';

export const dynamic = 'force-dynamic';

type EmbeddedOrder = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  currency: string;
  subtotal: number;
  shipping_fee: number;
  vat_amount: number | null;
  tax: number | null;
  total: number;
  shipping_address: Record<string, string> | null;
  countries: { name: string } | null;
};

type SupplierOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  supplier_amount: number;
  platform_commission: number;
  orders: EmbeddedOrder | null;
};

function NotFoundShell({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <BackHeader title="Order Details" />
      <EmptyState icon={<Package size={26} />} title="Order not found" message={message} />
    </div>
  );
}

function BackHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/supplier/orders"
        aria-label="Back to orders"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-surface text-content-primary transition-colors hover:bg-surface-page"
      >
        <ArrowLeft size={20} />
      </Link>
      <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">{title}</h1>
    </div>
  );
}

/**
 * Port of mobile `app/supplier/orders/[id].tsx`.
 *
 * Everything is scoped through `order_items.supplier_id`, which is also how the
 * mobile screen enforces access: the order is read as an embed off the
 * supplier's own line items, so a supplier can never open somebody else's
 * order. The financial summary shows both sides of the 90/10 split from real
 * columns (`order_items.supplier_amount` vs `order_items.platform_commission`).
 */
export default async function SupplierOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await params;
  const { user } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) {
    return (
      <NotFoundShell message="No supplier profile yet — add your first product to initialize it." />
    );
  }

  const { data: itemRows } = await supabase
    .from('order_items')
    .select(
      `id, product_name, quantity, unit_price, subtotal, supplier_amount, platform_commission,
       orders (
         id, order_number, status, created_at, currency, subtotal, shipping_fee, vat_amount,
         tax, total, shipping_address, countries (name)
       )`
    )
    .eq('order_id', orderId)
    .eq('supplier_id', supplier.id);

  const items = (itemRows ?? []) as unknown as SupplierOrderItem[];
  const order = items[0]?.orders ?? null;

  if (items.length === 0 || !order) {
    return <NotFoundShell message="Order not found, or it contains none of your products." />;
  }

  const [{ data: shipmentRow }, { data: courierRows }] = await Promise.all([
    supabase
      .from('shipments')
      .select(
        'id, courier_id, tracking_number, carrier, status, couriers (name, code, tracking_url_format)'
      )
      .eq('order_id', orderId)
      .eq('supplier_id', supplier.id)
      .maybeSingle(),
    supabase
      .from('couriers')
      .select('id, name, code, tracking_url_format')
      .eq('is_active', true)
      .order('name'),
  ]);

  const address = order.shipping_address;
  const destination = order.countries?.name ?? address?.country ?? null;
  const addressLine = [
    address?.street,
    address?.city,
    address?.state,
    address?.zipCode,
    address?.country,
  ]
    .filter(Boolean)
    .join(', ');

  const yourSubtotal = items.reduce((sum, i) => sum + Number(i.subtotal ?? 0), 0);
  const payout = items.reduce((sum, i) => sum + Number(i.supplier_amount ?? 0), 0);
  const commission = items.reduce((sum, i) => sum + Number(i.platform_commission ?? 0), 0);
  const money = (amount: number | null | undefined) => formatOrderAmount(order.currency, amount);

  return (
    <div className="space-y-3.5">
      <BackHeader title="Order Details" />

      {/* Order header */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-extrabold text-content-primary">#{order.order_number}</p>
            <p className="mt-1 text-base text-content-tertiary">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {destination && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-3xl bg-surface-tint px-2.5 py-1.5">
            <Globe size={14} className="text-primary" />
            <span className="text-base font-bold text-primary">Destination: {destination}</span>
          </div>
        )}
      </section>

      <ShipmentForm
        orderId={orderId}
        supplierId={supplier.id}
        orderStatus={order.status}
        couriers={(courierRows ?? []) as ShipmentCourier[]}
        shipment={(shipmentRow ?? null) as unknown as SupplierShipment | null}
      />

      {/* Delivery address */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <div className="mb-3.5 flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-content-primary">Delivery Address</h2>
        </div>
        <p className="text-md leading-6 text-content-secondary">
          {addressLine || 'No delivery address on file for this order.'}
        </p>
      </section>

      {/* Items */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <div className="mb-3.5 flex items-center gap-2">
          <Package size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-content-primary">Your Items in This Order</h2>
        </div>
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border-b border-edge-light py-2.5 last:border-b-0"
            >
              <span className="min-w-0 truncate text-md font-bold text-content-primary">
                {item.quantity}&times; {item.product_name}
              </span>
              <span className="shrink-0 text-md font-bold text-content-primary">
                {money(item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Financial summary */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <div className="mb-3.5 flex items-center gap-2">
          <Receipt size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-content-primary">Order Financial Summary</h2>
        </div>

        <dl>
          <FinRow label="Subtotal" value={money(order.subtotal)} />
          <FinRow label="Shipping Fee" value={money(order.shipping_fee)} />
          {Number(order.vat_amount ?? 0) > 0 && (
            <FinRow label="VAT / Tax" value={money(order.vat_amount)} />
          )}
          <div className="my-1 h-px bg-edge" />
          <FinRow label="Order Total" value={money(order.total)} strong />
          <div className="my-1 h-px bg-edge" />
          <FinRow label="Your Items Subtotal" value={money(yourSubtotal)} />
          <FinRow label="Platform Commission" value={`- ${money(commission)}`} tone="error" />
          <FinRow label="Your Payout" value={money(payout)} strong tone="success" />
        </dl>
      </section>
    </div>
  );
}

function FinRow({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'success' | 'error';
}) {
  const color =
    tone === 'success' ? 'text-success' : tone === 'error' ? 'text-error' : 'text-content-primary';

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className={strong || tone ? `text-lg font-bold ${color}` : 'text-md text-content-tertiary'}>
        {label}
      </dt>
      <dd className={strong ? `text-2xl font-extrabold ${color}` : `text-md font-bold ${color}`}>
        {value}
      </dd>
    </div>
  );
}
