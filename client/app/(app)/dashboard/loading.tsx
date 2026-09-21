import { HeaderSkeleton, LoadingRegion, PanelSkeleton, Skeleton } from '@/components/ui/Skeleton';

/** Mirrors the dashboard: Today + Water, the targets strip, then the week. */
export default function DashboardLoading() {
  return (
    <LoadingRegion label="your dashboard">
      <HeaderSkeleton />
      <div className="grid gap-5 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
        <PanelSkeleton lines={4} />
      </div>
      <Skeleton className="mt-5 h-36 rounded-2xl" />
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
