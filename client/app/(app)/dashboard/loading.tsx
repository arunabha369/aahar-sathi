import { PanelSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <PanelSkeleton lines={6} />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <div className="space-y-5">
          <PanelSkeleton lines={3} />
          <PanelSkeleton lines={4} />
        </div>
      </div>
    </div>
  );
}
