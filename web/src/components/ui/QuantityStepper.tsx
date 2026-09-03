'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Mobile recipe: 44x44 buttons radius 12, value 18px/800 in Colors.secondary. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const atMin = value <= min;
  const atMax = max != null && value >= max;

  const btn =
    'flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-edge ' +
    'text-content-primary transition-colors hover:bg-surface-page disabled:opacity-40';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={atMin}
        aria-label="Decrease quantity"
        className={btn}
      >
        <Minus size={16} />
      </button>

      <span className="flex h-11 w-14 items-center justify-center rounded-lg text-2xl font-extrabold text-secondary">
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        aria-label="Increase quantity"
        className={btn}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
