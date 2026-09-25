import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TermsView } from './TermsView';

export const metadata: Metadata = {
  title: 'Terms & Conditions — SATHUN GLOBAL',
  description:
    'Complete Marketplace Terms and Conditions for SATHUN Global, including Supplier Terms & Conditions and Customer Terms of Service.',
};

export default function TermsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-sm font-medium text-content-tertiary">Loading terms &amp; conditions...</div>
        </div>
      }
    >
      <TermsView />
    </Suspense>
  );
}
