import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { BulkProductManager } from '@/components/bulk/BulkProductManager';
import { BULK_PRODUCT_SELECT, type BulkProduct } from '@/components/bulk/bulk-types';

export const dynamic = 'force-dynamic';

/** Admin catalog — every product on the platform, with bulk editing. */
export default async function AdminProductsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(BULK_PRODUCT_SELECT)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  return (
    <BulkProductManager
      title="Product Catalog"
      initialProducts={(products ?? []) as BulkProduct[]}
      categories={categories ?? []}
    />
  );
}
