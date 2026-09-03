import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import ProductForm from '@/components/ProductForm';

/**
 * SECURITY: this query MUST be scoped to the caller's own supplier_id.
 * RLS does not protect reads here — 20260115164339 grants
 * "Authenticated users can view all products" FOR SELECT USING (true) — so an
 * unscoped lookup let any signed-in supplier open a competitor's product by id
 * and read their wholesale price, MOQ and SKU straight out of the form.
 */
export default async function EditSupplierProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Admins reach this page from /supplier/products, which allows them too.
  const { user, profile } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) {
    notFound();
  }

  const [{ data: product }, { data: categories }, { data: image }] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, description, category_id, b2c_price, b2b_price, moq, shipping_cost, stock_quantity, sku'
      )
      .eq('id', id)
      .eq('supplier_id', supplier.id)
      .maybeSingle(),
    supabase.from('categories').select('id, name').order('name'),
    supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', id)
      .eq('is_primary', true)
      .maybeSingle(),
  ]);

  // Someone else's product (or a bad id) is indistinguishable from "not found".
  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-5xl font-extrabold tracking-[-0.5px] text-content-primary">
        Edit product
      </h1>
      <ProductForm
        categories={categories ?? []}
        userId={user.id}
        supplierId={supplier.id}
        businessNameFallback={profile.full_name ?? profile.email}
        existingProduct={product}
        existingImageUrl={image?.image_url}
      />
    </div>
  );
}
