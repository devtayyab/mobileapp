'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { cn } from '@/lib/cn';

/** Banner set ported from app/(tabs)/index.tsx HERO_BANNERS. */
const HERO_BANNERS = [
  {
    id: '1',
    title: 'New Season Arrivals',
    subtitle: 'Up to 40% off selected items',
    cta: 'Shop Now',
    image:
      'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=1400',
    overlay: 'rgba(26,26,46,0.72)',
    accent: '#E94560',
  },
  {
    id: '2',
    title: 'Premium Fashion',
    subtitle: 'Discover the latest trends',
    cta: 'Explore',
    image:
      'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=1400',
    overlay: 'rgba(15,52,96,0.72)',
    accent: '#F59E0B',
  },
  {
    id: '3',
    title: 'Wholesale Pricing',
    subtitle: 'B2B deals for bulk orders',
    cta: 'Get Deals',
    image:
      'https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=1400',
    overlay: 'rgba(6,78,59,0.72)',
    accent: '#10B981',
  },
];

const ROTATE_MS = 3800;

export function HomeHero({ firstName, isB2B }: { firstName: string | null; isB2B: boolean }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Mobile rotates the hero every 3.8s; pause on hover so it's readable.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % HERO_BANNERS.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? (t.goodMorning ?? 'Good morning')
      : hour < 17
        ? (t.goodAfternoon ?? 'Good afternoon')
        : (t.goodEvening ?? 'Good evening');

  const banner = HERO_BANNERS[index];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium tracking-[0.3px] text-content-tertiary">{greeting}</p>
          <h1 className="text-4xl font-extrabold tracking-[-0.3px] text-content-primary">
            {firstName ?? 'Guest'}
            {isB2B && (
              <span className="ml-2 align-middle text-lg font-bold text-primary">
                · {t.wholesalePricing ?? 'Wholesale pricing'}
              </span>
            )}
          </h1>
        </div>

        <Link
          href="/search"
          className="flex items-center gap-2 rounded-xl border border-edge bg-surface px-3.5 py-2.5 text-base text-content-tertiary transition-colors hover:border-secondary sm:min-w-[280px]"
        >
          <Search size={18} />
          {t.search ?? 'Search products…'}
        </Link>
      </div>

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative h-[240px] overflow-hidden rounded-4xl sm:h-[320px]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: banner.overlay }} />

            <div className="absolute inset-0 flex flex-col justify-center gap-3 px-6 sm:px-10">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="max-w-md text-6xl font-extrabold leading-tight tracking-[-0.5px] text-white sm:text-7xl"
              >
                {banner.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-sm text-lg text-white/85"
              >
                {banner.subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
              >
                <Link
                  href="/shop"
                  style={{ backgroundColor: banner.accent }}
                  className="inline-flex w-fit items-center gap-2 rounded-xl px-5 py-3 text-md font-bold text-white shadow-card transition-transform hover:scale-[1.03]"
                >
                  {banner.cta}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {HERO_BANNERS.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setIndex(i)}
              aria-label={`Show banner ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
