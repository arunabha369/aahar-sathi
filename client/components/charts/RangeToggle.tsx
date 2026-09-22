'use client';

import { cn } from '@/lib/utils';

export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];

/** The 7 / 30 / 90 days switch shared by the progress charts and summaries. */
export function RangeToggle({
  value,
  onChange,
  className,
}: {
  value: RangeDays;
  onChange: (days: RangeDays) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex rounded-lg bg-canvas p-0.5 ring-1 ring-line', className)} role="group" aria-label="Time range">
      {RANGE_OPTIONS.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => onChange(days)}
          aria-pressed={value === days}
          className={cn(
            'min-h-11 rounded-md px-4 text-xs font-bold transition-colors',
            value === days ? 'bg-surface-3 text-ink ring-1 ring-line-strong' : 'text-muted hover:text-ink',
          )}
        >
          {days} days
        </button>
      ))}
    </div>
  );
}
