import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SubmitTicketView } from './SubmitTicketView';

export const metadata: Metadata = {
  title: 'Submit a Support Ticket — SATHUN GLOBAL',
  description:
    'Learn how to open a support ticket, attach photos and documents, check resolution status, report supplier issues, and flag urgent requests on SATHUN GLOBAL.',
  keywords: [
    'submit a ticket',
    'support ticket',
    'help center',
    'customer support',
    'supplier dispute',
    'order help',
    'SATHUN GLOBAL',
  ],
};

export default function SubmitTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-sm font-medium text-content-tertiary">
            Loading support ticket guide...
          </div>
        </div>
      }
    >
      <SubmitTicketView />
    </Suspense>
  );
}
