'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  Package,
  ShoppingBag,
  User,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Modal,
  SearchInput,
  Select,
  StatusBadge,
  Tabs,
  type Column,
} from '@/components/ui';
import { formatOrderAmount } from '@/components/orders/types';
import type { OrderStatus } from '@/types/database';

export type AdminOrderLine = {
  product_name: string;
  quantity: number;
  unit_price: number;
};

export type AdminOrderRow = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total: number;
  platform_commission: number;
  /** The currency the order was charged in — never converted (see CONTRIBUTING). */
  currency: string;
  created_at: string;
  customer: { full_name: string | null; email: string } | null;
  items: AdminOrderLine[];
};

/** Full `order_status` enum (migration 20260115152126). */
const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

/**
 * Mobile's one-tap progression (`nextStatus` in app/admin/orders.tsx).
 * Terminal states (delivered / cancelled / refunded) have no successor.
 */
const NEXT_STATUS: Partial<Record<string, OrderStatus>> = {
  pending: 'processing',
  processing: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
};

const label = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

export function AdminOrdersTable({
  initialOrders,
  totalOrders,
}: {
  initialOrders: AdminOrderRow[];
  totalOrders: number;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nextStatusChoice, setNextStatusChoice] = useState<OrderStatus | ''>('');
  const [updating, setUpdating] = useState(false);
  const [confirming, setConfirming] = useState<{ order: AdminOrderRow; status: OrderStatus } | null>(
    null
  );

  // Keep the selection tied to the id so an in-place status update re-renders it.
  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;

      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.customer?.full_name ?? '').toLowerCase().includes(q) ||
        (o.customer?.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  /**
   * Counts come from the loaded window rather than exact `head` counts so a tab
   * badge never promises rows the list cannot show.
   */
  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: orders.length };
    for (const status of ALL_STATUSES) acc[status] = 0;
    for (const order of orders) acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, [orders]);

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    ...ALL_STATUSES.map((status) => ({
      key: status,
      label: label(status),
      count: counts[status],
    })),
  ];

  const updateStatus = async (order: AdminOrderRow, status: OrderStatus) => {
    if (status === order.status) return;
    setUpdating(true);

    const supabase = createClient();
    // `.select()` distinguishes "RLS matched no row" (empty array, no error)
    // from a real failure — a silent no-op would otherwise look like success.
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('id');

    setUpdating(false);
    setConfirming(null);

    if (error) {
      toast({ title: 'Status update failed', message: error.message, kind: 'error' });
      return;
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Status update blocked',
        message: 'The database rejected the change — your account may lack permission on orders.',
        kind: 'error',
      });
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    setNextStatusChoice('');
    toast({
      title: 'Order updated',
      message: `#${order.order_number} is now ${label(status)}.`,
      kind: 'order_status',
    });
    // The status tabs and the dashboard badge are server-rendered.
    router.refresh();
  };

  const columns: Column<AdminOrderRow>[] = [
    {
      key: 'order_number',
      header: 'Order',
      sortValue: (o) => o.order_number,
      render: (o) => (
        <span className="font-extrabold text-content-primary">#{o.order_number}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortValue: (o) => (o.customer?.full_name ?? o.customer?.email ?? '').toLowerCase(),
      render: (o) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-content-primary">
            {o.customer?.full_name ?? 'Unknown Customer'}
          </p>
          <p className="truncate text-sm text-content-tertiary">{o.customer?.email ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      sortValue: (o) => o.items.reduce((sum, i) => sum + i.quantity, 0),
      render: (o) => (
        <span className="text-content-tertiary">
          {o.items.reduce((sum, i) => sum + i.quantity, 0)}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortValue: (o) => o.total,
      render: (o) => (
        <span className="font-extrabold text-content-primary">
          {formatOrderAmount(o.currency, o.total)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (o) => o.status,
      render: (o) => <StatusBadge status={o.status} label={label(o.status)} />,
    },
    {
      key: 'created_at',
      header: 'Placed',
      sortValue: (o) => o.created_at,
      render: (o) => (
        <span className="text-content-tertiary">
          {new Date(o.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => {
        const next = NEXT_STATUS[o.status];

        return (
          <div className="flex justify-end gap-1.5">
            {next && (
              <Button
                size="sm"
                variant="secondary"
                disabled={updating}
                aria-label={`Advance order ${o.order_number} to ${label(next)}`}
                title={`Advance to ${label(next)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  void updateStatus(o, next);
                }}
              >
                {label(next)}
                <ChevronRight size={14} />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(o.id);
                setNextStatusChoice('');
              }}
            >
              View
            </Button>
          </div>
        );
      },
    },
  ];

  const advance = selected ? NEXT_STATUS[selected.status] : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by order # or customer…"
          className="w-full sm:w-80"
        />
        <Tabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(o) => o.id}
        onRowClick={(o) => {
          setSelectedId(o.id);
          setNextStatusChoice('');
        }}
        emptyState={
          <EmptyState
            icon={<ShoppingBag size={26} />}
            title="No orders found"
            message={
              orders.length === 0
                ? 'No orders have been placed yet.'
                : 'Try a different search term or status filter.'
            }
          />
        }
      />

      {totalOrders > orders.length && (
        <p className="text-sm text-content-tertiary">
          Showing the {orders.length.toLocaleString()} most recent of{' '}
          {totalOrders.toLocaleString()} orders. Status counts above cover this window only.
        </p>
      )}

      <Modal
        open={selected != null}
        onClose={() => setSelectedId(null)}
        title={selected ? `Order #${selected.order_number}` : undefined}
        size="lg"
      >
        {selected && (
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-edge bg-surface-page p-5">
              <StatusBadge status={selected.status} label={selected.status.toUpperCase()} />
              <p className="text-2xl font-extrabold text-content-primary">
                #{selected.order_number}
              </p>
              <p className="inline-flex items-center gap-1.5 text-base text-content-tertiary">
                <Calendar size={13} />
                {new Date(selected.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <section className="rounded-2xl border border-edge bg-surface-page p-4">
              <h3 className="mb-3 text-md font-bold uppercase tracking-[0.5px] text-content-primary">
                Customer
              </h3>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-content-tertiary">
                  <User size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-content-primary">
                    {selected.customer?.full_name ?? 'Unknown'}
                  </p>
                  <p className="truncate text-base text-content-tertiary">
                    {selected.customer?.email ?? '—'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-edge bg-surface-page p-4">
              <h3 className="mb-3 text-md font-bold uppercase tracking-[0.5px] text-content-primary">
                Order Items
              </h3>

              {selected.items.length === 0 ? (
                <p className="text-base text-content-tertiary">
                  No line items are readable for this order.
                </p>
              ) : (
                <ul className="divide-y divide-edge-light">
                  {selected.items.map((item, i) => (
                    <motion.li
                      key={`${item.product_name}-${i}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 240,
                        damping: 24,
                        delay: Math.min(i * 0.05, 0.3),
                      }}
                      className="flex items-center gap-2.5 py-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-content-tertiary">
                        <Package size={14} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-md text-content-primary">
                        {item.product_name}
                      </span>
                      <span className="shrink-0 text-base font-bold text-content-tertiary">
                        &times;{item.quantity}
                      </span>
                      <span className="shrink-0 text-md font-bold text-content-primary">
                        {formatOrderAmount(selected.currency, item.unit_price * item.quantity)}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}

              <dl className="mt-3 space-y-2 border-t border-edge pt-3">
                <div className="flex items-center justify-between">
                  <dt className="text-md text-content-tertiary">Subtotal</dt>
                  <dd className="text-md font-bold text-content-primary">
                    {formatOrderAmount(selected.currency, selected.subtotal)}
                  </dd>
                </div>
                {selected.platform_commission > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-md text-content-tertiary">Platform Commission</dt>
                    <dd className="text-md font-bold text-success">
                      {formatOrderAmount(selected.currency, selected.platform_commission)}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-edge pt-2">
                  <dt className="text-lg font-bold text-content-primary">Total</dt>
                  <dd className="text-2xl font-extrabold text-primary">
                    {formatOrderAmount(selected.currency, selected.total)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="space-y-2.5 rounded-2xl border border-edge bg-surface-page p-4">
              <h3 className="text-md font-bold uppercase tracking-[0.5px] text-content-primary">
                Update Status
              </h3>

              {advance && (
                <Button
                  fullWidth
                  variant="secondary"
                  loading={updating}
                  onClick={() => void updateStatus(selected, advance)}
                >
                  <ChevronRight size={17} />
                  Advance to &ldquo;{label(advance)}&rdquo;
                </Button>
              )}

              <div className="flex items-end gap-2">
                <Select
                  label="Set any status"
                  value={nextStatusChoice}
                  disabled={updating}
                  onChange={(e) => setNextStatusChoice(e.target.value as OrderStatus | '')}
                  className="flex-1"
                >
                  <option value="">Choose a status…</option>
                  {ALL_STATUSES.filter((s) => s !== selected.status).map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  disabled={!nextStatusChoice || updating}
                  onClick={() => {
                    if (!nextStatusChoice) return;
                    // Terminal / money-affecting transitions get a confirmation.
                    if (nextStatusChoice === 'cancelled' || nextStatusChoice === 'refunded') {
                      setConfirming({ order: selected, status: nextStatusChoice });
                      return;
                    }
                    void updateStatus(selected, nextStatusChoice);
                  }}
                >
                  Apply
                </Button>
              </div>

              {selected.status !== 'cancelled' && selected.status !== 'delivered' && (
                <Button
                  fullWidth
                  variant="outline"
                  className="border-error text-error"
                  disabled={updating}
                  onClick={() => setConfirming({ order: selected, status: 'cancelled' })}
                >
                  <XCircle size={17} />
                  Cancel Order
                </Button>
              )}

              <p className="text-sm text-content-tertiary">
                Current status <Badge tone="neutral">{label(selected.status)}</Badge>
              </p>
            </section>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirming != null}
        onClose={() => setConfirming(null)}
        onConfirm={() => confirming && void updateStatus(confirming.order, confirming.status)}
        title={confirming?.status === 'refunded' ? 'Refund Order' : 'Cancel Order'}
        message={
          confirming
            ? `Mark order #${confirming.order.order_number} as ${label(
                confirming.status
              )}? The customer is notified automatically by the order-status trigger.`
            : ''
        }
        confirmLabel={confirming?.status === 'refunded' ? 'Mark Refunded' : 'Cancel Order'}
        destructive
        loading={updating}
      />
    </div>
  );
}
