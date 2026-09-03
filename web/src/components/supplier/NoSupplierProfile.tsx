/**
 * Shown when the signed-in user has no `suppliers` row yet — the same graceful
 * degradation `src/app/(dashboard)/supplier/products/page.tsx` already does.
 * Admins reaching a supplier screen land here too, since the row is keyed on
 * `suppliers.user_id`.
 */

import Link from 'next/link';
import { Store } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export function NoSupplierProfile({ title }: { title: string }) {
  return (
    <div className="space-y-5">
      <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">{title}</h1>
      <EmptyState
        icon={<Store size={26} />}
        title="No supplier profile yet"
        message="Your seller profile is created with your first product. Add one to unlock orders, analytics and reviews."
        action={
          <Link
            href="/supplier/products/new"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-xl font-bold text-white transition-colors hover:bg-secondary-dark"
          >
            Add your first product
          </Link>
        }
      />
    </div>
  );
}
