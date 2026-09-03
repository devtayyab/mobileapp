'use client';

/**
 * Supplier incoming orders — port of mobile `app/supplier/orders.tsx`.
 *
 * The mobile screen reads `order_items` scoped to the supplier and groups the
 * rows by `order_id`, so an order shows only the lines this supplier fulfils.
 * Grouping happens server-side (see the page) and arrives here pre-shaped.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Package } from 'lucide-react';
import { EmptyState, StatusBadge, Tabs, type Tab } from '@/components/ui';
import { StatusIcon } from '@/components/orders/OrderHistoryList';
import { formatOrderAmount, formatOrderDate, localeFor } from '@/components/orders/types';
import { useLanguage } from '@/providers/LanguageProvider';

export type SupplierOrderLine = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  supplierAmount: number;
};

export type SupplierOrderGroup = {
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  /** The currency the order was charged in — never converted (see CONTRIBUTING). */
  currency: string;
  shipTo: string | null;
  items: SupplierOrderLine[];
  /** Sum of `order_items.supplier_amount` for this supplier's lines. */
  payout: number;
};

/** Mobile exposes exactly these four filters. */
const FILTERS = ['all', 'pending', 'processing', 'shipped'] as const;

export function SupplierOrdersList({ orders }: { orders: SupplierOrderGroup[] }) {
  const { t, language } = useLanguage();
  const locale = localeFor(language.code);
  const [filter, setFilter] = useState<string>('all');

  const labels: Record<(typeof FILTERS)[number], string> = {
    all: t.all ?? 'All',
    pending: t.pending ?? 'Pending',
    processing: t.processing ?? 'Processing',
    shipped: t.shipped ?? 'Shipped',
  };

  const tabs: Tab[] = FILTERS.map((key) => ({
    key,
    label: labels[key],
    count: key === 'all' ? orders.length : orders.filter((o) => o.status === key).length,
  }));

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          {t.orders ?? 'Orders'}
        </h1>
        <p className="mt-0.5 text-md text-content-tertiary">
          Incoming orders containing your products
        </p>
      </div>

      <Tabs tabs={tabs} active={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <EmptyState
          icon={<Package size={26} />}
          title="No orders found"
          message="Orders will appear here when customers purchase your products"
        />
      ) : (
        <ul className="flex flex-col gap-3.5">
          {visible.map((order, index) => (
            <motion.li
              key={order.orderId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 240,
                damping: 24,
                delay: Math.min(index * 0.05, 0.3),
              }}
            >
              <Link
                href={`/supplier/orders/${order.orderId}`}
                className="block rounded-2xl border border-edge bg-surface p-4 transition-colors hover:border-edge-dark hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xl font-extrabold text-content-primary">
                      #{order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-sm text-content-tertiary">
                      {formatOrderDate(order.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusIcon status={order.status} />
                    {/* Raw status string: StatusBadge keys its color off it. */}
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 border-y border-edge-light py-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <p className="truncate text-md text-content-secondary">
                        {item.quantity}&times; {item.productName}
                      </p>
                      <p className="shrink-0 text-md font-bold text-content-primary">
                        {formatOrderAmount(order.currency, item.supplierAmount)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-content-tertiary">Shipping To</p>
                    <p className="truncate text-md font-medium text-content-primary">
                      {order.shipTo ?? '—'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-content-tertiary">Your Share</p>
                    <p className="flex items-center gap-1 text-2xl font-extrabold text-success">
                      {formatOrderAmount(order.currency, order.payout)}
                      <ChevronRight size={16} className="text-content-tertiary" />
                    </p>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
