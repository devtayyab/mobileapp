import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import ProductForm from '@/components/ProductForm';

export default async function EditSupplierProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireRole(['supplier']);
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: image }] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, description, category_id, b2c_price, b2b_price, moq, shipping_cost, stock_quantity, sku'
      )
      .eq('id', id)
      .single(),
    supabase.from('categories').select('id, name').order('name'),
    supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', id)
      .eq('is_primary', true)
      .maybeSingle(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Edit product</h1>
      <ProductForm
        categories={categories ?? []}
        userId={user.id}
        businessNameFallback={profile.full_name ?? profile.email}
        existingProduct={product}
        existingImageUrl={image?.image_url}
      />
    </div>
  );
}
