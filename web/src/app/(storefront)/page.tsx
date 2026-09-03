import { createClient } from '@/lib/supabase/server';
import { getAdminProfile } from '@/lib/supabase/server';
import { HomeHero } from '@/components/home/HomeHero';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { ProductRail } from '@/components/home/ProductRail';
import { B2BBanner } from '@/components/home/B2BBanner';
import type { ProductCardData } from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

type RawProduct = {
  id: string;
  name: string;
  b2c_price: number;
  b2b_price: number | null;
  stock_quantity: number;
  is_featured: boolean;
  product_images: { image_url: string; is_primary: boolean }[] | null;
  categories: { name: string } | null;
};

function toCardData(rows: RawProduct[] | null): ProductCardData[] {
  return (rows ?? []).map((p) => {
    const primary = p.product_images?.find((i) => i.is_primary);
    return {
      id: p.id,
      name: p.name,
      b2c_price: p.b2c_price,
      b2b_price: p.b2b_price,
      stock_quantity: p.stock_quantity,
      is_featured: p.is_featured,
      categoryName: p.categories?.name ?? null,
      imageUrl: primary?.image_url ?? p.product_images?.[0]?.image_url ?? null,
    };
  });
}

export default async function HomePage() {
  const supabase = await createClient();
  const { profile } = await getAdminProfile();

  const PRODUCT_SELECT =
    'id, name, b2c_price, b2b_price, stock_quantity, is_featured, product_images (image_url, is_primary), categories (name)';

  const [featuredRes, newRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('categories')
      .select('id, name, slug, image_url')
      // `categories.is_active` is nullable (`DEFAULT true`, no NOT NULL), so a
      // NULL row is active-by-default — `.eq(true)` would hide it.
      .not('is_active', 'is', false)
      .is('parent_id', null)
      .order('display_order')
      .limit(8),
  ]);

  const isB2B = profile?.role === 'b2b';
  const firstName = profile?.full_name?.split(' ')[0] ?? null;

  return (
    <div className="space-y-8">
      <HomeHero firstName={firstName} isB2B={isB2B} />

      {(categoriesRes.data?.length ?? 0) > 0 && (
        <CategoryStrip categories={categoriesRes.data ?? []} />
      )}

      {!isB2B && profile?.role !== 'supplier' && profile?.role !== 'admin' && <B2BBanner />}

      <ProductRail
        title="Featured"
        href="/shop"
        products={toCardData(featuredRes.data as RawProduct[] | null)}
        isB2B={isB2B}
      />

      <ProductRail
        title="New Arrivals"
        href="/shop"
        products={toCardData(newRes.data as RawProduct[] | null)}
        isB2B={isB2B}
      />
    </div>
  );
}
