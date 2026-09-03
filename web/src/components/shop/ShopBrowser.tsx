'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PackageSearch, SlidersHorizontal } from 'lucide-react';
import { ProductCard, type ProductCardData } from '@/components/ProductCard';
import { Button, EmptyState, SearchInput } from '@/components/ui';
import { useLanguage } from '@/providers/LanguageProvider';
import { cn } from '@/lib/cn';

export type ShopCategory = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Ported from app/(tabs)/shop.tsx: header with live count, in-page search box
 * (client-side name filter, same as mobile), horizontally scrolling category
 * chips and a 2-up product grid. Category selection round-trips through
 * `?category=<id>` so the URL stays shareable and the server re-queries.
 */
export function ShopBrowser({
  products,
  categories,
  isB2B,
  selectedCategory,
}: {
  products: ProductCardData[];
  categories: ShopCategory[];
  isB2B: boolean;
  selectedCategory: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [pending, startTransition] = useTransition();
  // Optimistic chip highlight so the tap feels instant while the server refetches.
  const [activeCategory, setActiveCategory] = useState(selectedCategory);

  useEffect(() => {
    setActiveCategory(selectedCategory);
  }, [selectedCategory]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(query));
  }, [products, search]);

  const selectCategory = (id: string) => {
    if (id === activeCategory) return;
    setActiveCategory(id);
    startTransition(() => {
      router.push(id === 'all' ? '/shop' : `/shop?category=${id}`, { scroll: false });
    });
  };

  const countLabel = `${filtered.length} ${(t.products ?? 'Products').toLowerCase()}`;

  return (
    <div className="space-y-4">
      {/* Header: title, live count, search bar */}
      <div className="rounded-2xl border border-edge bg-surface p-4 sm:p-5">
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
              {t.shop ?? 'Shop'}
            </h1>
            <p className="mt-0.5 text-base font-semibold text-content-tertiary">{countLabel}</p>
          </div>
          <Link
            href="/search"
            aria-label={t.search ?? 'Search'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface-page text-primary transition-colors hover:border-secondary"
          >
            <SlidersHorizontal size={18} />
          </Link>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t.searchPlaceholder ?? 'Search products...'}
        />
      </div>

      {/* Category chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ id: 'all', name: t.all ?? 'All', slug: 'all' }, ...categories].map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'shrink-0 rounded-3xl border px-4 py-1.5 text-base font-bold transition-colors',
                active
                  ? 'border-secondary bg-secondary text-white'
                  : 'border-edge bg-surface text-content-tertiary hover:text-content-primary'
              )}
            >
              {/* Mobile looks the slug up in the bundle first: t[cat.slug] || cat.name */}
              {t[cat.slug] ?? cat.name}
            </motion.button>
          );
        })}
      </div>

      {/* Grid */}
      <div
        className={cn(
          'transition-opacity duration-200',
          pending && 'pointer-events-none opacity-50'
        )}
      >
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
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
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            icon={<PackageSearch size={26} />}
            title={t.noProductsFound ?? 'No products found'}
            message={
              search
                ? (t.tryDifferentKeywords ?? 'Try using different keywords')
                : 'Try a different category or search'
            }
            action={
              search ? (
                <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                  {t.cancel ?? 'Clear'}
                </Button>
              ) : activeCategory !== 'all' ? (
                <Button variant="outline" size="sm" onClick={() => selectCategory('all')}>
                  {t.all ?? 'All'}
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
