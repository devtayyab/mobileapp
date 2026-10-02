'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Package,
  X,
  ZoomIn,
  Palette,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { cn } from '@/lib/cn';

export type GalleryImage = {
  image_url: string;
  variant_name?: string;
  color_code?: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  colorCode?: string;
  imageUrl?: string;
};

export function ProductGallery({
  images,
  productName,
  variants,
  onVariantSelect,
}: {
  images: GalleryImage[];
  productName: string;
  variants?: ProductVariant[];
  onVariantSelect?: (variant: ProductVariant) => void;
}) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Default color variants if none are provided from the database
  const effectiveVariants: ProductVariant[] =
    variants && variants.length > 0
      ? variants
      : images.length > 1
        ? images.map((img, i) => {
            const colors = ['#1F2937', '#DC2626', '#2563EB', '#059669', '#D97706', '#7C3AED'];
            const names = ['Midnight Black', 'Ruby Red', 'Royal Blue', 'Emerald Green', 'Amber Gold', 'Deep Violet'];
            return {
              id: `variant-${i}`,
              name: img.variant_name || names[i % names.length],
              colorCode: img.color_code || colors[i % colors.length],
              imageUrl: img.image_url,
            };
          })
        : [
            { id: 'v-standard', name: 'Standard Edition', colorCode: '#1F2937', imageUrl: images[0]?.image_url },
            { id: 'v-slate', name: 'Slate Gray', colorCode: '#64748B', imageUrl: images[0]?.image_url },
            { id: 'v-cream', name: 'Alabaster White', colorCode: '#F1F5F9', imageUrl: images[0]?.image_url },
          ];

  const active = images[index] ?? images[0] ?? null;

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  const nextImage = () => {
    if (images.length <= 1) return;
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    if (variant.imageUrl) {
      const imgIdx = images.findIndex((img) => img.image_url === variant.imageUrl);
      if (imgIdx !== -1) {
        setIndex(imgIdx);
      }
    }
    if (onVariantSelect) {
      onVariantSelect(variant);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Main Showcase Hero Image */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        className="group relative aspect-square w-full cursor-crosshair overflow-hidden rounded-3xl border border-edge bg-surface shadow-subtle"
      >
        {active ? (
          <AnimatePresence mode="wait" initial={false}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={active.image_url}
              src={active.image_url}
              alt={productName}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{
                opacity: 1,
                scale: isZooming ? 2.2 : 1,
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: isZooming ? 0.05 : 0.22, ease: 'easeOut' }}
              className="absolute inset-0 h-full w-full object-contain p-4 select-none pointer-events-none"
            />
          </AnimatePresence>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 text-content-tertiary">
            <Package size={56} />
            <p className="text-lg">{t.noImage ?? 'No image'}</p>
          </div>
        )}

        {/* Hover Hint Badge */}
        {!isZooming && active && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-2xs font-bold text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={12} />
            <span>Hover to zoom details</span>
          </div>
        )}

        {/* Fullscreen Expand Button */}
        {active && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            aria-label="Enlarge image"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-surface/90 border border-edge text-content-primary shadow-subtle backdrop-blur-md transition-all hover:bg-primary hover:text-white hover:scale-105 active:scale-95"
          >
            <Maximize2 size={16} />
          </button>
        )}

        {/* Left & Right Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/85 border border-edge text-content-primary shadow-card backdrop-blur-sm transition-all hover:bg-primary hover:text-white hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/85 border border-edge text-content-primary shadow-card backdrop-blur-sm transition-all hover:bg-primary hover:text-white hover:scale-110 active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Counter Badge */}
        {images.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-2xs font-extrabold text-white backdrop-blur-sm">
            {index + 1} / {images.length}
          </span>
        )}
      </div>

      {/* 2. Photo Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
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
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-surface transition-all',
                idx === index
                  ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                  : 'border-edge hover:border-edge-dark opacity-80 hover:opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="" className="h-full w-full object-contain p-1" />
            </motion.button>
          ))}
        </div>
      )}

      {/* 3. Colour & Variant Selection (Visual Thumbnails) */}
      <div className="rounded-2xl border border-edge bg-surface p-4 space-y-3 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-content-primary">
              Colours &amp; Variants
            </h3>
          </div>
          <span className="text-xs font-semibold text-content-tertiary">
            {effectiveVariants.find((v) => v.id === selectedVariantId)?.name || 'Select Variant'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {effectiveVariants.map((variant) => {
            const isSelected = selectedVariantId === variant.id;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => handleSelectVariant(variant)}
                className={cn(
                  'group flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                    : 'border-edge bg-surface-page text-content-secondary hover:border-edge-dark hover:text-content-primary'
                )}
              >
                {/* Visual colour pill / thumbnail */}
                {variant.imageUrl ? (
                  <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-edge bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={variant.imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-primary/40 text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                ) : (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: variant.colorCode || '#1F2937' }}
                  >
                    {isSelected && <Check size={11} className="text-white drop-shadow" strokeWidth={3} />}
                  </span>
                )}
                <span>{variant.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && active && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close full view"
            >
              <X size={24} />
            </button>

            {/* Navigation Chevrons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-5 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                  aria-label="Previous"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-5 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                  aria-label="Next"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* Fullscreen Image */}
            <div className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.image_url}
                alt={productName}
                className="max-h-[85vh] max-w-[85vw] object-contain"
              />
            </div>

            {/* Bottom Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
              {productName} ({index + 1} of {images.length})
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
