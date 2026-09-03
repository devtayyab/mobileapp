import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Mobile recipe (app/product/[id].tsx): five 14px stars in #F59E0B
 * (`text-warning`), filled up to `value`, hollow after it.
 */
export function RatingStars({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-warning', className)}
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={1.8}
          fill={star <= value ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}
