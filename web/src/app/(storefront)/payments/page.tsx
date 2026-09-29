import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentsView } from './PaymentsView';

export const metadata: Metadata = {
  title: 'Payment Methods, Security & Refunds — SATHUN GLOBAL',
  description:
    'Learn about accepted payment methods, secure Stripe checkout, billing, currencies, taxes, and our 14-day refund policy on SATHUN GLOBAL.',
  keywords: [
    'payments',
    'payment methods',
    'Stripe checkout',
    'refund policy',
    'VAT and taxes',
    'credit cards',
    'SATHUN GLOBAL',
  ],
};

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-sm font-medium text-content-tertiary">Loading payments information...</div>
        </div>
      }
    >
      <PaymentsView />
    </Suspense>
  );
}
