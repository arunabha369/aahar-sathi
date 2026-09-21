import { HeaderSkeleton, LoadingRegion, PanelSkeleton } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <LoadingRegion label="your settings">
      <HeaderSkeleton />
      <div className="space-y-5">
        <PanelSkeleton lines={6} />
        <PanelSkeleton lines={5} />
        <PanelSkeleton lines={6} />
      </div>
    </LoadingRegion>
  );
}
