import { createClient } from '@/lib/supabase/server';
import ProductsTable from '@/components/ProductsTable';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, sku, b2c_price, b2b_price, stock_quantity, is_active, is_featured, category_id, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Product Catalog</h1>
      <ProductsTable initialProducts={products ?? []} categories={categories ?? []} />
    </div>
  );
}
