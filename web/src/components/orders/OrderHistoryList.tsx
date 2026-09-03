'use client';

/** Order history list — port of mobile `app/(tabs)/orders.tsx` (list part). */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Clock, Package, Truck, XCircle } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { EmptyState, StatusBadge } from '@/components/ui';
import { formatOrderAmount, formatOrderDate, localeFor, type OrderSummary } from './types';

export function StatusIcon({ status, size = 15 }: { status: string; size?: number }) {
  switch (status) {
    case 'delivered':
      return <CheckCircle2 size={size} className="text-status-delivered" />;
    case 'shipped':
      return <Truck size={size} className="text-status-shipped" />;
    case 'processing':
    case 'confirmed':
      return <Package size={size} className="text-status-processing" />;
    case 'cancelled':
      return <XCircle size={size} className="text-status-cancelled" />;
    case 'refunded':
      return <XCircle size={size} className="text-status-refunded" />;
    default:
      return <Clock size={size} className="text-status-pending" />;
  }
}

export function OrderHistoryList({ orders }: { orders: OrderSummary[] }) {
  const { t, language } = useLanguage();
  const locale = localeFor(language.code);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          {t.myOrders ?? 'My Orders'}
        </h1>
        <p className="mt-0.5 text-md text-content-tertiary">
          {(t.ordersCount ?? '{count} order{s}')
            .replace('{count}', String(orders.length))
            .replace('{s}', orders.length !== 1 ? 's' : '')}
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package size={26} />}
          title={t.noOrdersYet ?? 'No orders yet'}
          message={t.ordersWillAppear ?? 'Your orders will appear here after you purchase'}
          action={
            <Link
              href="/shop"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-xl font-bold text-white transition-colors hover:bg-secondary-dark"
            >
              {t.browseProducts ?? 'Browse products'}
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3.5">
          {orders.map((order, index) => {
            const items = order.order_items ?? [];
            const extra = Math.max(0, items.length - 2);

            return (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 8) * 0.05 } }}
              >
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-2xl border border-edge bg-surface p-4 transition-colors hover:border-edge-dark hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xl font-extrabold text-content-primary">
                        #{order.order_number}
                      </p>
                      <p className="mt-0.5 text-sm text-content-tertiary">
                        {formatOrderDate(order.created_at, locale)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusIcon status={order.status} />
                      {/* Raw status: StatusBadge keys its colors off the status string. */}
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-1 border-t border-edge-light pt-3">
                    {items.slice(0, 2).map((item, i) => (
                      <p key={i} className="truncate text-md text-content-secondary">
                        {item.quantity}&times; {item.product_name}
                      </p>
                    ))}
                    {extra > 0 && (
                      <p className="text-sm font-bold text-content-tertiary">
                        {(t.moreItems ?? '+{count} more').replace('{count}', String(extra))}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-edge-light pt-3">
                    <span className="text-md text-content-tertiary">{t.total ?? 'Total'}</span>
                    <span className="flex items-center gap-1 text-3xl font-extrabold text-content-primary">
                      {formatOrderAmount(order.currency, order.total)}
                      <ChevronRight size={16} className="text-content-tertiary" />
                    </span>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
