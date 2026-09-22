import { HeaderSkeleton, LoadingRegion, PanelSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function PrepLoading() {
  return (
    <LoadingRegion label="your prep plan">
      <HeaderSkeleton />
      <Skeleton className="mb-5 h-16 rounded-2xl" />
      <div className="columns-1 gap-5 md:columns-2 xl:columns-3 [&>*]:mb-5">
        {[6, 9, 4, 13, 5, 7].map((lines, index) => (
          <PanelSkeleton key={index} lines={lines} className="break-inside-avoid" />
        ))}
      </div>
    </LoadingRegion>
  );
}
