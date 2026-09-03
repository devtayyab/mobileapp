'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

/** Fallback imagery + tint pairs ported from app/(tabs)/index.tsx. */
const CATEGORY_IMAGES: Record<string, string> = {
  clothing: 'https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=300',
  fashion: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=300',
  accessories: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=300',
  lifestyle: 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=300',
  electronics: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=300',
  footwear: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
};

const CATEGORY_COLORS = [
  { bg: '#FFF1F2', text: '#E11D48' },
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#ECFDF5', text: '#065F46' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#F5F3FF', text: '#5B21B6' },
  { bg: '#FFFBEB', text: '#92400E' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FEF2F2', text: '#991B1B' },
];

export type StripCategory = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export function CategoryStrip({ categories }: { categories: StripCategory[] }) {
  const { t } = useLanguage();

  const imageFor = (c: StripCategory) =>
    c.image_url ?? CATEGORY_IMAGES[(c.slug || c.name).toLowerCase()] ?? null;

  return (
    <section>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-content-primary">{t.categories ?? 'Categories'}</h2>
        <Link
          href="/categories"
          className="flex items-center gap-0.5 text-base font-semibold text-secondary hover:underline"
        >
          {t.seeAll ?? 'See all'}
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category, i) => {
          const tint = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
          const image = imageFor(category);

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
            >
              <Link
                href={`/shop?category=${category.id}`}
                className="group flex flex-col items-center gap-2"
              >
                <span
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl transition-transform group-hover:scale-105"
                  style={{ backgroundColor: tint.bg }}
                >
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-extrabold" style={{ color: tint.text }}>
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-center text-sm font-semibold text-content-primary">
                  {category.name}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
