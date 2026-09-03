'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export type Tab = { key: string; label: string; count?: number };

/** Horizontal filter chips with an animated active pill (mobile filter tabs). */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'relative shrink-0 rounded-3xl px-3.5 py-2 text-base font-bold transition-colors',
              isActive ? 'text-white' : 'text-content-tertiary hover:text-content-primary'
            )}
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-3xl bg-primary"
              />
            )}
            <span className="relative z-10">
              {tab.label}
              {tab.count != null && (
                <span className={cn('ml-1.5', isActive ? 'text-white/75' : 'text-content-tertiary')}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
