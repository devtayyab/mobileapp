import { Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import { BulkProductManager } from '@/components/bulk/BulkProductManager';
import { BULK_PRODUCT_SELECT, type BulkProduct } from '@/components/bulk/bulk-types';

export const dynamic = 'force-dynamic';

/**
 * Supplier catalog — same bulk editor as the admin screen, but scoped to this
 * supplier's own rows. The "Suppliers can manage own products" RLS policy is the
 * real boundary; the explicit supplier_id filter just avoids fetching noise.
 */
export default async function SupplierProductsPage() {
  const { user } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) {
    return (
      <div className="space-y-5">
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          My Products
        </h1>
        <EmptyState
          icon={<Package size={26} />}
          title="No supplier profile yet"
          message="Add your first product to initialize your supplier profile."
          action={
            <a
              href="/supplier/products/new"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-xl font-bold text-white"
            >
              Add product
            </a>
          }
        />
      </div>
    );
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(BULK_PRODUCT_SELECT)
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  return (
    <BulkProductManager
      title="My Products"
      initialProducts={(products ?? []) as BulkProduct[]}
      categories={categories ?? []}
      addHref="/supplier/products/new"
      editHrefFor={(id) => `/supplier/products/${id}/edit`}
    />
  );
}
