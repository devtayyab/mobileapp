import Link from 'next/link';
import { Clock, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import ProductForm from '@/components/ProductForm';

export default async function NewSupplierProductPage() {
  const { user, profile } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  if (profile.role !== 'admin') {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, kyc_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!supplier || supplier.kyc_status !== 'approved') {
      return (
        <div className="space-y-5">
          <h1 className="mb-4 text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
            Add product
          </h1>
          <div className="rounded-2xl border border-warning bg-warning/10 p-6">
            <div className="flex items-start gap-3">
              <Clock size={24} className="mt-0.5 shrink-0 text-warning" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-warning">
                  Supplier Account Pending Super Admin Approval
                </h2>
                <p className="text-md leading-6 text-content-secondary">
                  Your supplier registration is currently under review by the super admin. You will be able to list, publish, and sell products as soon as your account has been approved.
                </p>
                <div className="pt-2">
                  <Link
                    href="/supplier/dashboard"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-md font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  return (
    <div>
      <h1 className="mb-4 text-5xl font-extrabold tracking-[-0.5px] text-content-primary">Add product</h1>
      <ProductForm
        categories={categories ?? []}
        userId={user.id}
        businessNameFallback={profile.full_name ?? profile.email}
      />
    </div>
  );
}
