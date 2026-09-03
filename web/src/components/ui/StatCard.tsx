'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/cn';

/** Counts up to `value` once scrolled into view. */
function useCountUp(value: number, active: boolean, duration = 900) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (value === 0) {
      setDisplay(0);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      setDisplay(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, active, duration]);

  return display;
}

export function StatCard({
  label,
  value,
  icon,
  format,
  hint,
  className,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  /** e.g. formatPrice from useCurrency, or a plain number formatter */
  format?: (n: number) => string;
  hint?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const animated = useCountUp(value, inView);

  const shown = format
    ? format(animated)
    : Math.round(animated).toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={cn('rounded-2xl border border-edge bg-surface p-4', className)}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-[0.5px] text-content-tertiary">
          {label}
        </span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-tint text-primary">
            {icon}
          </span>
        )}
      </div>
      <p className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">{shown}</p>
      {hint && <p className="mt-1 text-sm text-content-tertiary">{hint}</p>}
    </motion.div>
  );
}
