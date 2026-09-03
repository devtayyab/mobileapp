'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ProductCard, type ProductCardData } from '@/components/ProductCard';
import { useLanguage } from '@/providers/LanguageProvider';

export function ProductRail({
  title,
  href,
  products,
  isB2B,
}: {
  title: string;
  href: string;
  products: ProductCardData[];
  isB2B: boolean;
}) {
  const { t } = useLanguage();

  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-content-primary">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-0.5 text-base font-semibold text-secondary hover:underline"
        >
          {t.seeAll ?? 'See all'}
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.3), type: 'spring', stiffness: 240, damping: 24 }}
          >
            <ProductCard product={product} isB2B={isB2B} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
