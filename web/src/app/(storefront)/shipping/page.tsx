import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ShippingView } from './ShippingView';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Guide — SATHUN GLOBAL',
  description:
    'Information about global shipping, supplier delivery timelines, order tracking, customs duties, split packages, and address changes on SATHUN GLOBAL.',
  keywords: [
    'shipping',
    'delivery',
    'track order',
    'customs duties',
    'delivery times',
    'supplier shipping',
    'SATHUN GLOBAL',
  ],
};

export default function ShippingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-sm font-medium text-content-tertiary">
            Loading shipping &amp; delivery information...
          </div>
        </div>
      }
    >
      <ShippingView />
    </Suspense>
  );
}
