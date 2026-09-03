'use client';

/**
 * Recent orders — port of the "Recent Orders" section of mobile
 * `app/supplier/dashboard.tsx`.
 *
 * The mobile screen showed `totalRevenue / totalOrders` as each row's amount
 * (an explicitly "simplified approximation" in its own comment). That is a
 * fabricated per-order figure, so it is not ported: each row shows the real sum
 * of this supplier's `order_items.supplier_amount` for that order, in the
 * order's own currency.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Package, ShoppingCart } from 'lucide-react';
import { EmptyState, StatusBadge } from '@/components/ui';
import { formatMoney } from './money';

export type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  currency: string;
  /** This supplier's cut of the order, not the shopper's order total. */
  supplierAmount: number;
  itemCount: number;
};

export function RecentOrdersList({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={26} />}
        title="No recent activity"
        message="Orders containing your products will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order, i) => (
        <motion.li
          key={order.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 240,
            damping: 24,
            delay: Math.min(i * 0.05, 0.3),
          }}
        >
          <Link
            href={`/supplier/orders/${order.id}`}
            className="flex items-center gap-3 rounded-2xl border border-edge bg-surface p-4 transition-colors hover:border-edge-dark hover:shadow-card"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-surface-page text-content-tertiary">
              <ShoppingCart size={18} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-bold text-content-primary">
                Order #{order.orderNumber}
              </span>
              <span className="block text-sm text-content-tertiary">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' · '}
                {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
              </span>
            </span>

            <span className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge status={order.status} />
              <span className="text-md font-extrabold text-content-primary">
                {formatMoney(order.currency, order.supplierAmount)}
              </span>
            </span>

            <ChevronRight size={16} className="shrink-0 text-content-tertiary" />
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
