import { HeaderSkeleton, LoadingRegion, PanelSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function PlanDetailLoading() {
  return (
    <LoadingRegion label="this plan">
      <Skeleton className="mb-4 h-5 w-24" />
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-2xl" />
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <PanelSkeleton lines={8} />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <div className="min-w-0 space-y-5">
          <PanelSkeleton lines={5} />
          <PanelSkeleton lines={2} />
        </div>
      </div>
    </LoadingRegion>
  );
}
