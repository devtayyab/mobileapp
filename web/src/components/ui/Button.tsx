'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  // Mobile's primary CTA uses Colors.secondary with white label
  primary: 'bg-secondary text-white hover:bg-secondary-dark shadow-subtle',
  secondary: 'bg-primary text-white hover:bg-primary-dark shadow-subtle',
  outline: 'border-[1.5px] border-edge bg-surface text-content-primary hover:bg-surface-page',
  ghost: 'text-content-tertiary hover:bg-surface-page hover:text-content-primary',
  danger: 'bg-error text-white hover:bg-error-dark',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-base rounded-lg gap-1.5',
  md: 'h-11 px-4 text-xl rounded-xl gap-2',
  lg: 'h-12 px-6 text-xl rounded-xl gap-2',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.015 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex select-none items-center justify-center font-bold transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
