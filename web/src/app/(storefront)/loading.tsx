import { Skeleton, SkeletonCard } from '@/components/ui';

/**
 * Rendered instantly on every storefront navigation while the server component
 * fetches. Without this the browser holds the previous page until the request
 * finishes, which reads as the app being slow.
 */
export default function StorefrontLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
      </div>

      <Skeleton className="h-[240px] w-full rounded-4xl sm:h-[320px]" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
