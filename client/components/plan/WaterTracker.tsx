'use client';

import { useId, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { litres } from '@/lib/format';
import { useLocalToday } from '@/lib/useLocalToday';
import type { WaterLog } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WaterTrackerProps {
  target: number;
  logs: WaterLog[];
  serverToday: string;
}

/** A tumbler that fills from the bottom — the clip path is shared by every glass. */
function Glass({ filled }: { filled: boolean }) {
  const clipId = useId();

  return (
    <svg viewBox="0 0 28 36" aria-hidden="true" className="size-full">
      <defs>
        <clipPath id={clipId}>
          <path d="M5 4h18l-2.2 27.4A3 3 0 0 1 17.8 34h-7.6a3 3 0 0 1-3-2.6L5 4Z" />
        </clipPath>
      </defs>
      <path
        d="M5 4h18l-2.2 27.4A3 3 0 0 1 17.8 34h-7.6a3 3 0 0 1-3-2.6L5 4Z"
        fill="#FFFFFF"
        stroke={filled ? '#0086C9' : '#CFD8D4'}
        strokeWidth="2"
      />
      {filled ? (
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="11" width="28" height="25" fill="#36BFFA" />
          <path d="M0 12c4-3 7-3 11 0s7 3 11 0 6-3 6-3v4H0Z" fill="#7CD4FD" />
        </g>
      ) : null}
      <rect x="4" y="2" width="20" height="3.4" rx="1.7" fill={filled ? '#0086C9' : '#E3E8E5'} />
    </svg>
  );
}

export function WaterTracker({ target, logs, serverToday }: WaterTrackerProps) {
  const router = useRouter();
  const toast = useToast();
  const today = useLocalToday(serverToday);
  const [, startTransition] = useTransition();
  const loggedToday = logs.find((log) => log.date === today)?.glasses ?? 0;
  const [glasses, setOptimisticGlasses] = useOptimistic(loggedToday);

  const setGlasses = (next: number) => {
    startTransition(async () => {
      setOptimisticGlasses(next);
      try {
        // The date comes from the browser, so "today" follows the user's timezone.
        await api.put<{ log: WaterLog }>(`/logs/water/${today}`, { glasses: next });
        router.refresh();
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not save your water log.');
      }
    });
  };

  const percent = Math.min(100, Math.round((glasses / target) * 100));
  const complete = glasses >= target;

  return (
    <div data-print="hide" className="no-print">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm font-semibold text-muted">
          <span className="text-[1.75rem] font-extrabold leading-none text-ink tabular-nums">{glasses}</span>
          <span className="text-ink"> / {target} glasses</span>
          <span className="ml-1.5 text-xs">
            ({litres(glasses)} of {litres(target)})
          </span>
        </p>
        <p className="text-sm font-bold text-water-700 tabular-nums">{percent}%</p>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={glasses}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label="Water drunk today"
      >
        <div
          className="h-full rounded-full bg-water-500 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {Array.from({ length: target }, (_, index) => {
          const number = index + 1;
          const filled = number <= glasses;
          const isLastFilled = number === glasses;

          return (
            <button
              key={number}
              type="button"
              // Tapping the last filled glass empties it; tapping any other fills up to it.
              onClick={() => setGlasses(isLastFilled ? number - 1 : number)}
              aria-pressed={filled}
              aria-label={`${filled ? 'Glass' : 'Fill up to glass'} ${number} of ${target}`}
              className={cn(
                'grid size-11 place-items-center rounded-xl p-1.5 transition-all active:scale-95',
                filled ? 'bg-water-50 ring-1 ring-water-200' : 'ring-1 ring-line hover:bg-canvas',
              )}
            >
              <span className="block size-full">
                <Glass filled={filled} />
              </span>
            </button>
          );
        })}
      </div>

      {complete ? (
        <p className="mt-5 flex items-center gap-2.5 rounded-2xl bg-water-50 px-4 py-3 text-sm font-bold text-water-700 ring-1 ring-inset ring-water-200">
          <span className="grid size-6 place-items-center rounded-full bg-water-600">
            <Check className="size-3.5 text-white" strokeWidth={3.5} aria-hidden="true" />
          </span>
          Great job — water goal complete!
        </p>
      ) : (
        <p className="mt-5 text-sm text-muted">
          {target - glasses} more {target - glasses === 1 ? 'glass' : 'glasses'} to go today.
        </p>
      )}
    </div>
  );
}
