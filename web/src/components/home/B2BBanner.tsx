'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';

/** Mirrors the mobile home screen's wholesale upsell block. */
export function B2BBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-4xl border border-edge p-6"
      style={{ background: 'var(--gradient-premium)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white">
            <TrendingUp size={22} />
          </span>
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.3px] text-white">
              Buying in bulk?
            </h2>
            <p className="text-lg text-white/85">
              Unlock wholesale pricing with a B2B account.
            </p>
          </div>
        </div>

        <Link
          href="/register"
          /* The banner keeps its green gradient in both themes, so the pill's
             label is a fixed dark ink — `text-content-primary` turns near-white
             in dark mode and disappears against bg-white. */
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-md font-bold text-[#1F2937] transition-transform hover:scale-[1.03]"
        >
          Get wholesale pricing
          <ArrowRight size={16} />
        </Link>
      </div>
    </motion.section>
  );
}
