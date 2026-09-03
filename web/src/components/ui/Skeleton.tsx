import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-lg bg-surface-page',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-black/[0.06] after:to-transparent',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-4">
      <Skeleton className="mb-3 h-40 w-full rounded-xl" />
      <Skeleton className="mb-2 h-3 w-1/3" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-5 w-1/4" />
    </div>
  );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-edge-light rounded-2xl border border-edge bg-surface">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
