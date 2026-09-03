'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Mobile card recipe: bg background.secondary, radius 16, 1px border.medium.
 * Borders (not shadows) are the dominant elevation cue in the mobile app.
 */
export function Card({
  className,
  interactive = false,
  children,
  ...props
}: HTMLMotionProps<'div'> & { interactive?: boolean }) {
  return (
    <motion.div
      whileHover={interactive ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'overflow-hidden rounded-2xl border border-edge bg-surface',
        interactive && 'cursor-pointer hover:shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 p-4', className)}>
      <div>
        <h3 className="text-2xl font-bold text-content-primary">{title}</h3>
        {subtitle && <p className="mt-0.5 text-base text-content-tertiary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
