import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import AddToCartButton from '@/components/AddToCartButton';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  await requireRole(['b2b']);
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, b2c_price, b2b_price, currency, stock_quantity, sku')
    .eq('is_active', true)
    .order('name')
    .limit(200);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Shop</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => (
          <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-medium text-slate-900">{p.name}</h2>
            {p.sku && <p className="mb-2 text-xs text-slate-400">SKU: {p.sku}</p>}
            <p className="mb-1 text-lg font-semibold text-slate-900">
              {p.currency} {(p.b2b_price ?? p.b2c_price).toFixed(2)}
              <span className="ml-1 text-xs font-normal text-slate-400">/ unit (B2B)</span>
            </p>
            <p className="mb-3 text-xs text-slate-500">{p.stock_quantity} in stock</p>
            <AddToCartButton
              productId={p.id}
              price={p.b2b_price ?? p.b2c_price}
              disabled={p.stock_quantity <= 0}
            />
          </div>
        ))}
        {(products ?? []).length === 0 && (
          <p className="text-sm text-slate-400">No products available.</p>
        )}
      </div>
    </div>
  );
}
