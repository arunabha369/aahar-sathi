'use client';

import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { MacroLine } from '@/components/plan/MacroLine';
import { MealPhoto } from '@/components/plan/MealPhoto';
import { Skeleton } from '@/components/ui/Skeleton';
import { MACRO_COLORS, SERIES_COLORS, SLOT_META } from '@/lib/constants';
import { formatDayLong, formatItem, minutesFromTime, weekdayFromKey } from '@/lib/format';
import { useLocalToday } from '@/lib/useLocalToday';
import { useMinutesNow } from '@/lib/useNow';
import type { PlanDay, Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

/** A meal stays "now" for an hour after its start time. */
const MEAL_WINDOW = 60;

interface TodayCardProps {
  days: PlanDay[];
  targets: Targets;
  serverToday: string;
}

/** Bullet chart row: value bar, target marker, and the numbers in words beside it. */
function Bullet({
  label,
  value,
  target,
  unit,
  color,
  lowAt,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  /** Below this share of target the row reads "Low"; undefined means no low warning. */
  lowAt?: number;
}) {
  const ratio = target > 0 ? value / target : 0;
  const max = Math.max(target * 1.25, value * 1.05);
  const status =
    lowAt !== undefined && ratio < lowAt ? 'low' : ratio > 1.15 ? 'high' : ratio >= 0.9 ? 'ok' : 'under';

  const badge =
    status === 'ok' ? (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.6875rem] font-bold text-brand-800">
        <Check className="size-3" strokeWidth={3} aria-hidden="true" /> On target
      </span>
    ) : status === 'low' || status === 'high' ? (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-saffron-50 px-1.5 py-0.5 text-[0.6875rem] font-bold text-saffron-800">
        {status === 'low' ? (
          <ArrowDown className="size-3" strokeWidth={3} aria-hidden="true" />
        ) : (
          <ArrowUp className="size-3" strokeWidth={3} aria-hidden="true" />
        )}
        {status === 'low' ? 'Low' : 'High'}
      </span>
    ) : (
      <span className="text-[0.6875rem] font-bold text-muted tabular-nums">{Math.round(ratio * 100)}% of target</span>
    );

  return (
    <div>
      <dt className="flex items-center justify-between gap-3 text-[0.8125rem]">
        <span className="font-semibold text-ink-soft">{label}</span>
        {badge}
      </dt>
      <dd className="mt-1.5 flex items-center gap-3">
        <span className="relative h-2.5 min-w-0 flex-1 rounded-full bg-canvas ring-1 ring-inset ring-line" aria-hidden="true">
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }}
          />
          <span
            className="absolute -inset-y-1 w-0.5 rounded-full bg-ink"
            style={{ left: `calc(${(target / max) * 100}% - 1px)` }}
          />
        </span>
        <span className="shrink-0 whitespace-nowrap text-[0.8125rem] font-semibold text-muted tabular-nums">
          <span className="font-bold text-ink">{value.toLocaleString('en-IN')}</span> / {target.toLocaleString('en-IN')} {unit}
        </span>
      </dd>
    </div>
  );
}

export function TodayCard({ days, targets, serverToday }: TodayCardProps) {
  const todayKey = useLocalToday(serverToday);
  const minutes = useMinutesNow();
  const dayIndex = Math.max(0, days.findIndex((day) => day.day === weekdayFromKey(todayKey)));
  const today = days[dayIndex]!;
  const tomorrow = days[(dayIndex + 1) % days.length]!;

  const upcomingIndex =
    minutes === null ? -1 : today.meals.findIndex((meal) => minutesFromTime(meal.time) + MEAL_WINDOW > minutes);
  const allDone = minutes !== null && upcomingIndex === -1;
  const featured = allDone ? tomorrow.meals[0]! : upcomingIndex >= 0 ? today.meals[upcomingIndex]! : null;
  const isNow = featured !== null && !allDone && minutes !== null && minutes >= minutesFromTime(featured.time);

  return (
    <section aria-labelledby="today-heading" className="surface p-5 sm:p-6" data-print="hide">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Today</p>
          <h2 id="today-heading" className="mt-1 text-lg font-bold text-ink sm:text-xl">
            {formatDayLong(todayKey)}
          </h2>
        </div>
        <p className="text-sm font-semibold text-muted tabular-nums">
          <span className="font-bold text-ink">{today.totals.kcal.toLocaleString('en-IN')}</span> kcal planned
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
        {/* Up next */}
        <div className="min-w-0">
          {featured === null ? (
            <div aria-hidden="true">
              <Skeleton className="h-6 w-56 rounded-full" />
              <div className="mt-3 flex gap-4">
                <Skeleton className="size-20 shrink-0 rounded-2xl sm:size-24" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold',
                  isNow ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-800',
                )}
              >
                {allDone ? 'Tomorrow' : isNow ? 'Now' : 'Up next'} · {SLOT_META[featured.slot].label} · {featured.time}
              </p>
              <div className="mt-3 flex gap-4">
                <MealPhoto slug={featured.slug} slot={featured.slot} className="size-20 sm:size-24" sizes="96px" />
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-snug text-ink sm:text-lg">{featured.name}</h3>
                  <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted">
                    {featured.items.map((item) => formatItem(item)).join(' · ')}
                  </p>
                  <MacroLine meal={featured} />
                </div>
              </div>
            </div>
          )}

          {/* The day at a glance: which meals are behind you, which is now, which are ahead */}
          <ol className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Today's meals">
            {today.meals.map((meal, index) => {
              const passed = allDone || (upcomingIndex >= 0 && index < upcomingIndex);
              const current = !allDone && index === upcomingIndex;
              return (
                <li key={meal.slot} className="min-w-0">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block h-1.5 rounded-full',
                      passed ? 'bg-brand-600' : current ? 'bg-brand-300' : 'bg-line',
                    )}
                  />
                  <span className={cn('mt-1.5 block truncate text-[0.6875rem] font-bold', current ? 'text-brand-800' : 'text-muted')}>
                    {SLOT_META[meal.slot].short}
                  </span>
                  <span className="block text-[0.6875rem] text-muted tabular-nums">{meal.time.replace(':00', '')}</span>
                  <span className="sr-only">
                    {' '}
                    {meal.name}, {passed ? 'earlier today' : current ? 'up next' : 'later today'}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Today's plan against target */}
        <div className="min-w-0 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-[0.8125rem] font-bold text-ink">Today&apos;s plan vs your targets</p>
          <dl className="mt-3 space-y-3.5">
            <Bullet label="Calories" value={today.totals.kcal} target={targets.calories} unit="kcal" color={SERIES_COLORS.calories} />
            <Bullet label="Protein" value={today.totals.protein} target={targets.protein} unit="g" color={MACRO_COLORS.protein} lowAt={0.85} />
            <Bullet label="Carbs" value={today.totals.carbs} target={targets.carbs} unit="g" color={MACRO_COLORS.carbs} />
            <Bullet label="Fat" value={today.totals.fat} target={targets.fat} unit="g" color={MACRO_COLORS.fat} />
          </dl>
        </div>
      </div>
    </section>
  );
}
