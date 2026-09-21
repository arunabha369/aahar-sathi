import { HeaderSkeleton, LoadingRegion, Skeleton } from '@/components/ui/Skeleton';

export default function PlansLoading() {
  return (
    <LoadingRegion label="your plans">
      <HeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-56 rounded-2xl" />
        ))}
      </div>
    </LoadingRegion>
  );
}
