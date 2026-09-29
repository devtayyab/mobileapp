import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegistrationView } from './RegistrationView';

export const metadata: Metadata = {
  title: 'Customer & Supplier Registration Guide — SATHUN GLOBAL',
  description:
    'Learn how to register as a customer or supplier on SATHUN GLOBAL. Access retail & wholesale purchasing, supplier document verification, and 0 registration fee onboarding.',
  keywords: [
    'registration',
    'customer registration',
    'supplier registration',
    'become a supplier',
    'wholesale account',
    'SATHUN GLOBAL',
    'seller onboarding',
  ],
};

export default function RegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-sm font-medium text-content-tertiary">
            Loading registration guide...
          </div>
        </div>
      }
    >
      <RegistrationView />
    </Suspense>
  );
}
