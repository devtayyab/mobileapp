'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { cn } from '@/lib/cn';

export type GalleryImage = {
  image_url: string;
};

/**
 * Mobile recipe: 320px contain-fit hero + 56px thumbnail strip, active thumb
 * outlined in Colors.secondary. Images arrive already sorted primary-first.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  const active = images[index] ?? images[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-edge bg-surface">
        {active ? (
          <AnimatePresence mode="wait" initial={false}>
            {/* Product images are arbitrary Supabase/CDN URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={active.image_url}
              src={active.image_url}
              alt={productName}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
          </AnimatePresence>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 text-content-tertiary">
            <Package size={56} />
            <p className="text-lg">{t.noImage ?? 'No image'}</p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <motion.button
              key={`${img.image_url}-${idx}`}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              onClick={() => setIndex(idx)}
              aria-label={`Show image ${idx + 1} of ${images.length}`}
              aria-current={idx === index}
              className={cn(
                'h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 bg-surface transition-colors',
                idx === index ? 'border-secondary' : 'border-transparent hover:border-edge'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt=""
                className="h-full w-full object-contain"
              />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
