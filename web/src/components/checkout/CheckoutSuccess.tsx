'use client';

/** Success state after the order is written — mobile `orderSuccess` branch. */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, Package } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button, StatusBadge } from '@/components/ui';
import { formatAmount } from './types';

export function CheckoutSuccess({
  orderId,
  orderNumber,
  total,
  currency,
  issues = [],
}: {
  orderId: string | null;
  orderNumber: string;
  total: number;
  currency: string;
  /**
   * Bookkeeping that failed AFTER the card was charged (payment receipt, stock
   * decrement, cart clear). The payment and the order are real either way, so
   * this is a warning, not an error — but the shopper is told to contact
   * support rather than left thinking everything reconciled.
   */
  issues?: string[];
}) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="mx-auto flex max-w-lg flex-col items-center gap-3 py-10 text-center"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
        className="flex h-[90px] w-[90px] items-center justify-center rounded-4xl bg-success/10 text-success"
      >
        <CheckCircle2 size={48} />
      </motion.span>

      <h1 className="text-6xl font-extrabold text-content-primary">{t.orderPlaced ?? 'Order Placed!'}</h1>
      <p className="text-lg text-content-tertiary">
        {t.orderConfirmedMessage ?? 'Your order has been confirmed and is being processed.'}
      </p>

      {issues.length > 0 && (
        <div className="mt-3 w-full rounded-2xl border border-warning bg-warning/10 p-4 text-left">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
            <div className="min-w-0 space-y-1.5">
              <p className="text-lg font-bold text-warning">
                Your order went through, but something needs checking
              </p>
              <p className="text-md leading-5 text-content-secondary">
                Your payment was taken and order {orderNumber} was created, but{' '}
                {issues.join(', ')}. Please contact support and quote this order number so it can
                be reconciled.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 w-full divide-y divide-edge-light rounded-2xl border border-edge bg-surface px-4 text-left">
        <SummaryRow label={t.orderNumber ?? 'Order Number'} value={orderNumber} />
        <SummaryRow label={t.totalPaid ?? 'Total Paid'} value={formatAmount(currency, total)} emphasize />
        <SummaryRow label={t.payment ?? 'Payment'} value={t.creditDebitCard ?? 'Credit/Debit Card'} />
        <div className="flex items-center justify-between gap-3 py-3">
          <span className="text-md text-content-tertiary">{t.status ?? 'Status'}</span>
          <StatusBadge status="pending" />
        </div>
      </div>

      <div className="mt-3 flex w-full flex-col gap-2">
        <Button
          fullWidth
          size="lg"
          onClick={() => router.push(orderId ? `/orders/${orderId}` : '/orders')}
        >
          <Package size={17} />
          {t.viewMyOrders ?? 'View My Orders'}
        </Button>
        <Button fullWidth size="lg" variant="outline" onClick={() => router.push('/shop')}>
          {t.continueShopping ?? 'Continue Shopping'}
          <ArrowRight size={16} />
        </Button>
      </div>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-md text-content-tertiary">{label}</span>
      <span
        className={
          emphasize
            ? 'text-3xl font-extrabold text-content-primary'
            : 'text-md font-bold text-content-primary'
        }
      >
        {value}
      </span>
    </div>
  );
}
