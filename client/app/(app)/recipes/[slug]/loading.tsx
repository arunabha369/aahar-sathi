import { HeaderSkeleton, LoadingRegion, Skeleton } from '@/components/ui/Skeleton';

export default function RecipeLoading() {
  return (
    <LoadingRegion label="the recipe">
      <HeaderSkeleton />
      <Skeleton className="mb-5 h-40 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    </LoadingRegion>
  );
}
