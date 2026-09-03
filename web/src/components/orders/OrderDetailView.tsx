'use client';

/**
 * Order detail — mobile shows this as a full-screen modal inside
 * app/(tabs)/orders.tsx; on web it is a real route (/orders/[id]).
 *
 * Schema notes: `shipments.courier_id` (later ALTER) joins to `couriers`, and
 * the legacy `shipments.carrier` text column is the fallback. `shipment_status`
 * is its own enum (pending|picked_up|in_transit|out_for_delivery|delivered|failed)
 * — 'shipped' only exists on `order_status`.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, MapPin, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { StatusBadge } from '@/components/ui';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { StatusIcon } from './OrderHistoryList';
import {
  formatOrderAmount,
  formatOrderDate,
  localeFor,
  type OrderDetail,
  type OrderShipment,
} from './types';

/** shipment_status -> the status token palette (distinct enum from order_status). */
const SHIPMENT_TONE: Record<string, string> = {
  pending: 'bg-status-pending',
  picked_up: 'bg-status-processing',
  in_transit: 'bg-status-shipped',
  out_for_delivery: 'bg-status-shipped',
  delivered: 'bg-status-delivered',
  failed: 'bg-status-cancelled',
};

function trackingUrl(shipment: OrderShipment) {
  const format = shipment.couriers?.tracking_url_format;
  if (!format || !shipment.tracking_number) return null;

  const url = format
    .replace('{tracking_number}', shipment.tracking_number)
    .replace('{tracking}', shipment.tracking_number)
    .replace('%s', shipment.tracking_number);

  return url === format ? null : url;
}

export function OrderDetailView({ order }: { order: OrderDetail }) {
  const { t, language } = useLanguage();
  const locale = localeFor(language.code);

  const items = order.order_items ?? [];
  const shipment = order.shipments?.[0] ?? null;
  const address = order.shipping_address ?? null;
  const courierName = shipment?.couriers?.name ?? shipment?.carrier ?? null;
  const link = shipment ? trackingUrl(shipment) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/orders"
          aria-label={t.myOrders ?? 'My Orders'}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-surface text-content-primary transition-colors hover:bg-surface-page"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
            #{order.order_number}
          </h1>
          <p className="mt-0.5 text-sm text-content-tertiary">
            {t.orderDate ?? 'Order Date'}: {formatOrderDate(order.created_at, locale)}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <StatusIcon status={order.status} size={16} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Status timeline */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-edge bg-surface p-5"
      >
        <h2 className="mb-5 text-2xl font-bold text-content-primary">
          {t.orderStatus ?? 'Order Status'}
        </h2>
        <OrderStatusTimeline status={order.status} />
      </motion.section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-5">
          {/* Shipment tracking */}
          {shipment && (shipment.tracking_number || courierName) && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
              className="rounded-2xl border border-edge bg-surface p-5"
            >
              <h2 className="mb-3 text-2xl font-bold text-content-primary">
                {t.shipmentTracking ?? 'Shipment Tracking'}
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                {courierName && (
                  <span className="inline-flex items-center gap-1.5 rounded-3xl bg-surface-tint px-2.5 py-1 text-sm font-extrabold text-primary">
                    <Truck size={13} />
                    {courierName}
                    {shipment.couriers?.code ? (
                      <span className="font-bold text-content-tertiary">
                        ({shipment.couriers.code})
                      </span>
                    ) : null}
                  </span>
                )}
                {shipment.status && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-3xl px-2.5 py-1 text-xxs font-extrabold uppercase tracking-[0.5px] text-white',
                      SHIPMENT_TONE[shipment.status] ?? 'bg-content-tertiary'
                    )}
                  >
                    {shipment.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {shipment.tracking_number && (
                <div className="mt-3 rounded-xl border border-edge-light bg-surface-page px-3.5 py-3">
                  <p className="text-2xs font-extrabold uppercase tracking-[0.5px] text-content-tertiary">
                    {t.trackingNum ?? 'Tracking Number'}
                  </p>
                  <p className="mt-1 break-all text-3xl font-extrabold text-content-primary">
                    {shipment.tracking_number}
                  </p>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                    >
                      Track shipment
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}

              <dl className="mt-3 flex flex-col gap-1.5">
                {shipment.shipped_at && (
                  <DetailRow
                    label="Shipped"
                    value={formatOrderDate(shipment.shipped_at, locale)}
                  />
                )}
                {shipment.estimated_delivery && (
                  <DetailRow
                    label="Estimated delivery"
                    value={formatOrderDate(shipment.estimated_delivery, locale)}
                  />
                )}
                {shipment.delivered_at && (
                  <DetailRow
                    label={t.delivered ?? 'Delivered'}
                    value={formatOrderDate(shipment.delivered_at, locale)}
                  />
                )}
              </dl>
            </motion.section>
          )}

          {/* Items */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="rounded-2xl border border-edge bg-surface p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Package size={17} className="text-primary" />
              <h2 className="text-2xl font-bold text-content-primary">
                {t.orderItems ?? 'Order Items'}
              </h2>
            </div>

            <ul className="divide-y divide-edge-light">
              {items.map((item, index) => (
                <motion.li
                  key={`${item.product_name}-${index}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.12 + index * 0.04 } }}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-md font-bold text-content-primary">
                    {item.product_name}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-content-tertiary">
                    {item.quantity}&times; {formatOrderAmount(order.currency, item.unit_price)}
                  </span>
                  <span className="w-24 shrink-0 text-right text-md font-extrabold text-content-primary">
                    {formatOrderAmount(
                      order.currency,
                      item.subtotal ?? item.unit_price * item.quantity
                    )}
                  </span>
                </motion.li>
              ))}
              {items.length === 0 && (
                <li className="py-2.5 text-md text-content-tertiary">No items recorded.</li>
              )}
            </ul>
          </motion.section>

          {/* Delivery address */}
          {address && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
              className="rounded-2xl border border-edge bg-surface p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={17} className="text-primary" />
                <h2 className="text-2xl font-bold text-content-primary">
                  {t.deliveryAddress ?? 'Delivery Address'}
                </h2>
              </div>

              {order.countries?.name && (
                <span className="mb-2 inline-flex items-center rounded-3xl bg-surface-tint px-2.5 py-1 text-sm font-bold text-content-secondary">
                  🌍 {order.countries.name}
                </span>
              )}

              <p className="whitespace-pre-line text-md leading-6 text-content-secondary">
                {[
                  address.street,
                  [address.city, address.state].filter(Boolean).join(', '),
                  address.zipCode ?? address.zip ?? '',
                  address.country,
                ]
                  .filter((line) => line && line.trim().length > 0)
                  .join('\n')}
              </p>
            </motion.section>
          )}
        </div>

        {/* Totals + meta */}
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="flex flex-col gap-4 lg:sticky lg:top-6"
        >
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <h2 className="mb-3 text-2xl font-bold text-content-primary">
              {t.orderSummary ?? 'Order Summary'}
            </h2>

            <div className="flex flex-col gap-1.5">
              <DetailRow
                label={t.subtotal ?? 'Subtotal'}
                value={formatOrderAmount(order.currency, order.subtotal)}
              />
              <DetailRow
                label={t.shipping ?? 'Shipping'}
                value={
                  order.shipping_fee > 0
                    ? formatOrderAmount(order.currency, order.shipping_fee)
                    : (t.free ?? 'Free')
                }
              />
              {order.vat_amount ? (
                <DetailRow
                  label={`${t.vat ?? 'VAT'}/Tax`}
                  value={formatOrderAmount(order.currency, order.vat_amount)}
                />
              ) : order.countries?.vat_type === 'included' ? (
                <DetailRow label={`${t.vat ?? 'VAT'}/Tax`} value="Included" />
              ) : null}

              <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-edge pt-2.5">
                <span className="text-xl font-bold text-content-primary">{t.total ?? 'Total'}</span>
                <span className="text-4xl font-extrabold text-content-primary">
                  {formatOrderAmount(order.currency, order.total)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-edge bg-surface p-5">
            <h2 className="mb-3 text-2xl font-bold text-content-primary">
              {t.orderDetails ?? 'Order Details'}
            </h2>
            <div className="flex flex-col gap-1.5">
              <DetailRow
                label={t.orderNumber ?? 'Order Number'}
                value={`#${order.order_number}`}
              />
              <DetailRow
                label={t.orderDate ?? 'Order Date'}
                value={formatOrderDate(order.created_at, locale)}
              />
              <DetailRow
                label={t.status ?? 'Status'}
                value={t[order.status] ?? order.status}
              />
            </div>
          </section>
        </motion.aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-md text-content-tertiary">{label}</span>
      <span className="shrink-0 text-md font-bold capitalize text-content-primary">{value}</span>
    </div>
  );
}
