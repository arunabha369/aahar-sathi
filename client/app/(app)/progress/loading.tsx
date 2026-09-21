import { HeaderSkeleton, LoadingRegion, PanelSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function ProgressLoading() {
  return (
    <LoadingRegion label="your progress">
      <HeaderSkeleton />
      <div className="grid gap-5 lg:grid-cols-3">
        <PanelSkeleton lines={2} className="lg:col-span-2" />
        <PanelSkeleton lines={2} />
      </div>
      <div className="mt-5 space-y-5">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </LoadingRegion>
  );
}
