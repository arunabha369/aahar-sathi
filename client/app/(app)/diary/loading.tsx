import { HeaderSkeleton, LoadingRegion, PanelSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function DiaryLoading() {
  return (
    <LoadingRegion label="your food diary">
      <HeaderSkeleton />
      <Skeleton className="mb-5 h-11 rounded-xl" />
      <PanelSkeleton lines={3} />
      <div className="mt-5">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </LoadingRegion>
  );
}
