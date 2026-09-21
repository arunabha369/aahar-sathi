import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden="true" />;
}

export function PanelSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('surface p-5 sm:p-6', className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-6 w-48" />
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-3.5 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Wraps a page skeleton. The shimmer itself is aria-hidden, so this announces the
 * wait to screen readers once instead of leaving them in silence.
 */
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading {label}…</span>
      {children}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="mb-6 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}
