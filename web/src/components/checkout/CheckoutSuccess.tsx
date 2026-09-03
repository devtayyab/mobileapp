'use client';

/** Success state after the order is written — mobile `orderSuccess` branch. */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Package } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button, StatusBadge } from '@/components/ui';
import { formatAmount } from './types';

export function CheckoutSuccess({
  orderId,
  orderNumber,
  total,
  currency,
}: {
  orderId: string | null;
  orderNumber: string;
  total: number;
  currency: string;
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
