import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import ProductsTable from '@/components/ProductsTable';

export const dynamic = 'force-dynamic';

export default async function SupplierProductsPage() {
  const { user } = await requireRole(['supplier']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) {
    return (
      <div>
        <h1 className="mb-2 text-lg font-semibold text-slate-900">My Products</h1>
        <p className="text-sm text-slate-500">
          No supplier profile yet —{' '}
          <a href="/supplier/products/new" className="underline">
            add your first product
          </a>{' '}
          to get started.
        </p>
      </div>
    );
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, sku, b2c_price, b2b_price, stock_quantity, is_active, is_featured, category_id, created_at'
      )
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">My Products</h1>
      <ProductsTable
        initialProducts={products ?? []}
        categories={categories ?? []}
        addHref="/supplier/products/new"
        editHrefFor={(id) => `/supplier/products/${id}/edit`}
      />
    </div>
  );
}
