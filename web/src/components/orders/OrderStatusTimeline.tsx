'use client';

/**
 * Status stepper — port of mobile `renderTrackingSteps()` in app/(tabs)/orders.tsx.
 * Cancelled / refunded orders never enter the stepper; they get a terminal row.
 */

import { motion } from 'framer-motion';
import { Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/providers/LanguageProvider';
import { ORDER_STEPS } from './types';

export function OrderStatusTimeline({ status }: { status: string }) {
  const { t } = useLanguage();
  const terminal = status === 'cancelled' || status === 'refunded';

  if (terminal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-xl bg-error/10 px-3.5 py-3"
      >
        <XCircle size={18} className="shrink-0 text-error" />
        <p className="text-md font-bold capitalize text-error">Order {t[status] ?? status}</p>
      </motion.div>
    );
  }

  const currentStep = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);

  return (
    <ol className="flex items-start">
      {ORDER_STEPS.map((step, index) => {
        const completed = index <= currentStep;
        const current = index === currentStep;
        const isLast = index === ORDER_STEPS.length - 1;

        return (
          <li key={step} className="relative flex flex-1 flex-col items-center">
            {/* Connector: from this dot's centre across to the next one. */}
            {!isLast && (
              <span className="absolute left-1/2 top-3 h-0.5 w-full -translate-y-1/2 bg-edge">
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: index < currentStep ? 1 : 0 }}
                  transition={{ delay: index * 0.09 + 0.12, duration: 0.32 }}
                  className="absolute inset-0 origin-left bg-secondary"
                />
              </span>
            )}

            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.09, type: 'spring', stiffness: 320, damping: 20 }}
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-3xl border-2',
                completed
                  ? 'border-secondary bg-secondary text-white'
                  : 'border-edge bg-surface text-content-tertiary',
                current && 'ring-4 ring-secondary/20'
              )}
            >
              {current ? (
                <span className="h-2 w-2 rounded-3xl bg-white" />
              ) : completed ? (
                <Check size={12} strokeWidth={3} />
              ) : null}
            </motion.span>

            <p
              className={cn(
                'mt-2 px-1 text-center text-2xs font-bold capitalize sm:text-sm',
                current
                  ? 'text-secondary'
                  : completed
                    ? 'text-content-secondary'
                    : 'text-content-tertiary'
              )}
            >
              {t[step] ?? step}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
