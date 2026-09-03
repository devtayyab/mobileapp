import { Skeleton, SkeletonCard } from '@/components/ui';

/** Grid of product placeholders — matches the /shop and /search grid columns. */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Search bar + category chip row + grid, i.e. the whole /shop body. */
export function ShopBodySkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-edge bg-surface p-4">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-3xl" />
        ))}
      </div>
      <ProductGridSkeleton />
    </div>
  );
}

/** Mosaic placeholder for /categories (every 5th tile is the wide one). */
export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={
            i % 5 === 0
              ? 'h-56 w-full rounded-3xl sm:col-span-2'
              : 'h-40 w-full rounded-3xl'
          }
        />
      ))}
    </div>
  );
}
