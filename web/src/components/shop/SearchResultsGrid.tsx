'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PackageSearch, Search as SearchIcon } from 'lucide-react';
import { ProductCard, type ProductCardData } from '@/components/ProductCard';
import { Button, EmptyState } from '@/components/ui';
import { useLanguage } from '@/providers/LanguageProvider';

/**
 * Result surface for /search — ported from app/search.tsx. Three states:
 * idle prompt (< 2 chars), zero results, and the results grid.
 */
export function SearchResultsGrid({
  query,
  products,
  isB2B,
}: {
  query: string;
  products: ProductCardData[];
  isB2B: boolean;
}) {
  const { t } = useLanguage();

  if (!query) {
    return (
      <EmptyState
        icon={<SearchIcon size={26} />}
        title={t.searchForProducts ?? 'Search for products'}
        message={t.enterAtLeast2Chars ?? 'Enter at least 2 characters to search'}
        action={
          <Link href="/shop">
            <Button variant="outline" size="sm">
              {t.shop ?? 'Shop'}
            </Button>
          </Link>
        }
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch size={26} />}
        title={t.noProductsFound ?? 'No products found'}
        message={t.tryDifferentKeywords ?? 'Try using different keywords'}
        action={
          <Link href="/categories">
            <Button variant="outline" size="sm">
              {t.categories ?? 'Categories'}
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <section className="space-y-3">
      <p className="text-base font-semibold text-content-tertiary">
        {products.length} {(t.products ?? 'Products').toLowerCase()} · &ldquo;{query}&rdquo;
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: Math.min(i * 0.05, 0.3),
              type: 'spring',
              stiffness: 240,
              damping: 24,
            }}
          >
            <ProductCard product={product} isB2B={isB2B} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
