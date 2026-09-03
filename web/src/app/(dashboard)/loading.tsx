import { Skeleton, SkeletonRows } from '@/components/ui';

/** Instant feedback for back-office navigations (see the storefront note). */
export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      <SkeletonRows rows={6} />
    </div>
  );
}
