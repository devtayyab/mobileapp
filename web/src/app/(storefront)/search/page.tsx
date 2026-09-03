import { Suspense } from 'react';
import { createClient, getAdminProfile } from '@/lib/supabase/server';
import { SearchBox } from '@/components/shop/SearchBox';
import { MIN_QUERY } from '@/components/shop/search-config';
import { SearchResultsGrid } from '@/components/shop/SearchResultsGrid';
import { ProductGridSkeleton } from '@/components/shop/ShopSkeletons';
import {
  PRODUCT_SELECT,
  toCardData,
  type RawStorefrontProduct,
} from '@/components/shop/product-data';

export const dynamic = 'force-dynamic';

/** Mobile parity: app/search.tsx caps at 20 rows. */
const RESULT_LIMIT = 24;

/**
 * PostgREST parses `or=(...)` on commas/parens, so strip the characters that
 * would break the filter (and the LIKE wildcards) out of user input.
 */
function sanitize(query: string) {
  return query.replace(/[,()*%\\"']/g, ' ').replace(/\s+/g, ' ').trim();
}

async function SearchBody({ query }: { query: string }) {
  if (query.length < MIN_QUERY) {
    return <SearchResultsGrid query="" products={[]} isB2B={false} />;
  }

  const supabase = await createClient();
  const term = sanitize(query);

  if (!term) {
    return <SearchResultsGrid query={query} products={[]} isB2B={false} />;
  }

  const [productsRes, { profile }] = await Promise.all([
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      // Mobile matches on name only; widened here to name / sku / description.
      .or(`name.ilike.%${term}%,sku.ilike.%${term}%,description.ilike.%${term}%`)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(RESULT_LIMIT),
    getAdminProfile(),
  ]);

  return (
    <SearchResultsGrid
      query={query}
      products={toCardData(productsRes.data as RawStorefrontProduct[] | null)}
      isB2B={profile?.role === 'b2b'}
    />
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = ((Array.isArray(q) ? q[0] : q) ?? '').trim();

  return (
    <div className="space-y-4">
      {/* Outside the boundary: typing must not remount the input. */}
      <SearchBox query={query} />

      <Suspense key={query} fallback={<ProductGridSkeleton count={5} />}>
        <SearchBody query={query} />
      </Suspense>
    </div>
  );
}
