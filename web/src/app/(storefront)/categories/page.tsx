import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { CategoryGrid, type BrowseCategory } from '@/components/shop/CategoryGrid';
import { CategoryGridSkeleton } from '@/components/shop/ShopSkeletons';

export const dynamic = 'force-dynamic';

async function CategoriesBody() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url')
    // `categories.is_active` is `boolean DEFAULT true` with no NOT NULL, so a
    // NULL row is active-by-default — `.eq(true)` would hide it.
    .not('is_active', 'is', false)
    .is('parent_id', null)
    .order('display_order');

  return <CategoryGrid categories={(data ?? []) as BrowseCategory[]} />;
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoryGridSkeleton />}>
      <CategoriesBody />
    </Suspense>
  );
}
