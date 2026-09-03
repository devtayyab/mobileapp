import { Suspense } from 'react';
import { createClient, getAdminProfile } from '@/lib/supabase/server';
import { ShopBrowser, type ShopCategory } from '@/components/shop/ShopBrowser';
import { ShopBodySkeleton } from '@/components/shop/ShopSkeletons';
import {
  PRODUCT_SELECT,
  toCardData,
  type RawStorefrontProduct,
} from '@/components/shop/product-data';

export const dynamic = 'force-dynamic';

/** Mobile parity: shop.tsx loads every active product for the selection. */
const PRODUCT_LIMIT = 200;

async function ShopBody({ category }: { category: string }) {
  const supabase = await createClient();

  let productQuery = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true);

  if (category !== 'all') {
    productQuery = productQuery.eq('category_id', category);
  }

  const [productsRes, categoriesRes, { profile }] = await Promise.all([
    productQuery.order('created_at', { ascending: false }).limit(PRODUCT_LIMIT),
    supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('display_order'),
    getAdminProfile(),
  ]);

  return (
    <ShopBrowser
      products={toCardData(productsRes.data as RawStorefrontProduct[] | null)}
      categories={(categoriesRes.data ?? []) as ShopCategory[]}
      isB2B={profile?.role === 'b2b'}
      selectedCategory={category}
    />
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const selected = (Array.isArray(category) ? category[0] : category) || 'all';

  return (
    <Suspense fallback={<ShopBodySkeleton />}>
      <ShopBody category={selected} />
    </Suspense>
  );
}
