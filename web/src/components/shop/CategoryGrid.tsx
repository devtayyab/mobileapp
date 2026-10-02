'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, LayoutGrid, Tag, Sparkles, Shirt } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { useLanguage } from '@/providers/LanguageProvider';
import { cn } from '@/lib/cn';

export type BrowseCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

/** Fallback imagery ported verbatim from app/(tabs)/categories.tsx. */
const CATEGORY_IMAGES: Record<string, string> = {
  clothing:
    'https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=800',
  fashion:
    'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800',
  accessories:
    'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800',
  lifestyle:
    'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800',
  electronics:
    'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=800',
  footwear:
    'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
  bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800',
  beauty:
    'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const CATEGORY_COLORS = [
  { bg: '#EFF6FF', accent: '#1D4ED8' },
  { bg: '#ECFDF5', accent: '#059669' },
  { bg: '#FFFBEB', accent: '#D97706' },
  { bg: '#FEF2F2', accent: '#DC2626' },
  { bg: '#F5F3FF', accent: '#7C3AED' },
  { bg: '#FFF7ED', accent: '#EA580C' },
  { bg: '#F0FDF4', accent: '#16A34A' },
  { bg: '#F8FAFC', accent: '#475569' },
];

function imageFor(category: BrowseCategory) {
  if (category.image_url) return category.image_url;
  const key = (category.slug || category.name || '').toLowerCase();
  for (const k of Object.keys(CATEGORY_IMAGES)) {
    if (key.includes(k)) return CATEGORY_IMAGES[k];
  }
  return null;
}

export const CLOTHING_SUBCATEGORIES = [
  {
    id: 'womens-clothing',
    name: "Women's Clothing",
    slug: 'womens-clothing',
    searchQuery: 'women',
    description: 'Trending styles, dresses, tops, skirts, and tailored fashion for women.',
    image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600',
    count: '240+ Items',
  },
  {
    id: 'mens-clothing',
    name: "Men's Clothing",
    slug: 'mens-clothing',
    searchQuery: 'men',
    description: 'Suits, formal shirts, polo shirts, jeans, and casual menswear.',
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600',
    count: '180+ Items',
  },
  {
    id: 'childrens-clothing',
    name: "Children's Clothing",
    slug: 'childrens-clothing',
    searchQuery: 'children',
    description: 'Comfortable, durable, and playful everyday outfits for boys and girls.',
    image: 'https://images.pexels.com/photos/3662850/pexels-photo-3662850.jpeg?auto=compress&cs=tinysrgb&w=600',
    count: '110+ Items',
  },
  {
    id: 'baby-clothing',
    name: 'Baby Clothing',
    slug: 'baby-clothing',
    searchQuery: 'baby',
    description: 'Ultra-soft organic cotton rompers, bodysuits, and sleepwear for newborns.',
    image: 'https://images.pexels.com/photos/3845493/pexels-photo-3845493.jpeg?auto=compress&cs=tinysrgb&w=600',
    count: '95+ Items',
  },
  {
    id: 'party-wear',
    name: 'Party Wear',
    slug: 'party-wear',
    searchQuery: 'party',
    description: 'Glamorous cocktail dresses, evening gowns, and festive celebration outfits.',
    image: 'https://images.pexels.com/photos/1755428/pexels-photo-1755428.jpeg?auto=compress&cs=tinysrgb&w=600',
    count: '140+ Items',
  },
  {
    id: 'wedding-dresses',
    name: 'Wedding Dresses',
    slug: 'wedding-dresses',
    searchQuery: 'wedding',
    description: 'Exquisite bridal gowns, ceremonial dresses, and couture wedding wear.',
    image: 'https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg?auto=compress&cs=tinysrgb&w=600',
    count: '70+ Items',
  },
];

/**
 * Ported from app/(tabs)/categories.tsx: promo banner, mosaic of category
 * tiles (every 5th is the wide/tall hero) and tap-through to
 * `/shop?category=<id>`.
 */
export function CategoryGrid({ categories }: { categories: BrowseCategory[] }) {
  const { t } = useLanguage();
  const clothingCat = categories.find((c) => c.slug === 'clothing' || c.name.toLowerCase().includes('clothing'));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 rounded-2xl border border-edge bg-surface p-4 sm:p-5">
        <div className="min-w-0">
          <h1 className="truncate text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
            {t.categories ?? 'Categories'}
          </h1>
          <p className="mt-0.5 text-base font-semibold text-content-tertiary">
            {categories.length} {(t.collections ?? 'Collections').toLowerCase()}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface-page text-primary">
          <LayoutGrid size={20} />
        </span>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={26} />}
          title={t.noCategories ?? 'No categories available'}
          message={t.tapToShop ?? 'Tap any category to shop'}
        />
      ) : (
        <>
          {/* Promo banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="flex items-center gap-3 rounded-xl border border-edge bg-surface-tint p-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-primary">
              <Tag size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-md font-bold text-secondary">
                {t.exploreCollections ?? 'Explore all collections'}
              </p>
              <p className="mt-0.5 text-sm text-content-tertiary">
                {t.tapToShop ?? 'Tap any category to shop'}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, i) => {
              const tint = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              const image = imageFor(category);
              const isLarge = i % 5 === 0;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{
                    delay: Math.min(i * 0.05, 0.3),
                    type: 'spring',
                    stiffness: 240,
                    damping: 24,
                  }}
                  className={cn(isLarge && 'sm:col-span-2')}
                >
                  <Link
                    href={`/shop?category=${category.id}`}
                    className={cn(
                      'group relative block overflow-hidden rounded-3xl border border-edge',
                      isLarge ? 'h-56' : 'h-40'
                    )}
                  >
                    {image ? (
                      // Category art comes from arbitrary Supabase/CDN URLs.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center text-6xl font-extrabold"
                        style={{ backgroundColor: tint.bg, color: tint.accent }}
                      >
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-3">
                      {/* Mobile prefers a translated slug: t[slug] || name */}
                      <p className="truncate text-xl font-extrabold text-white">
                        {t[category.slug] ?? category.name}
                      </p>
                      {category.description && (
                        <p
                          className={cn(
                            'mt-0.5 text-sm text-white/75',
                            isLarge ? 'line-clamp-2' : 'line-clamp-1'
                          )}
                        >
                          {t[`${category.slug}Desc`] ?? category.description}
                        </p>
                      )}
                    </div>

                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-white">
                      <ChevronRight size={14} />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Clothing & Fashion Subcategories Section */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-edge bg-surface p-4 sm:p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Shirt size={18} />
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-content-primary">
                    Clothing &amp; Apparel Subcategories
                  </h2>
                </div>
                <p className="text-sm text-content-tertiary">
                  Explore specialized collections from verified garment manufacturers &amp; suppliers
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                <Sparkles size={13} />
                6 Core Subcategories
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CLOTHING_SUBCATEGORIES.map((sub, idx) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ delay: idx * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
                >
                  <Link
                    href={`/shop?q=${encodeURIComponent(sub.searchQuery)}${clothingCat ? `&category=${clothingCat.id}` : ''}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-edge bg-surface shadow-subtle transition-all hover:border-primary/50 hover:shadow-card h-64"
                  >
                    {/* Background image with gradient overlay */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sub.image}
                      alt={sub.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                    {/* Top Badge */}
                    <div className="relative z-10 flex items-center justify-between p-4">
                      <span className="rounded-full bg-black/50 px-2.5 py-1 text-2xs font-extrabold uppercase tracking-wider text-white backdrop-blur-sm border border-white/10">
                        {sub.count}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:bg-primary">
                        <ChevronRight size={16} />
                      </span>
                    </div>

                    {/* Bottom Info */}
                    <div className="relative z-10 p-4 space-y-1">
                      <h3 className="text-2xl font-black text-white group-hover:text-primary-light transition-colors">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                        {sub.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
