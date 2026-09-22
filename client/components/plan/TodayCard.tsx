'use client';

import Link from 'next/link';
import { ArrowRight, Flame, NotebookPen } from 'lucide-react';
import { DiaryMeals } from '@/components/diary/DiaryMeals';
import { EatenSummary } from '@/components/diary/EatenSummary';
import { MacroLine } from '@/components/plan/MacroLine';
import { MealPhoto } from '@/components/plan/MealPhoto';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatClock, formatDayLong, formatItem, minutesFromTime, weekdayFromKey } from '@/lib/format';
import { mealLabel, recipeHref } from '@/lib/meals';
import { useDiary } from '@/lib/useDiary';
import { useLocalToday } from '@/lib/useLocalToday';
import { useMinutesNow } from '@/lib/useNow';
import type { DiaryDay, PlanDay, Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

/** A meal stays "now" for an hour after its start time. */
const MEAL_WINDOW = 60;

interface TodayCardProps {
  days: PlanDay[];
  targets: Targets;
  serverToday: string;
  /** Today's diary as the server rendered it. */
  diary: DiaryDay;
  /** Days logged in a row. */
  streak: number;
}

export function TodayCard({ days, targets, serverToday, diary: initialDiary, streak }: TodayCardProps) {
  const todayKey = useLocalToday(serverToday);
  const minutes = useMinutesNow();
  const diary = useDiary(initialDiary, todayKey);
  const dayIndex = Math.max(
    0,
    days.findIndex((day) => day.day === weekdayFromKey(todayKey)),
  );
  const planToday = days[dayIndex]!;
  // The diary has today's real sehri/iftar-based times; a plan keeps the week it was made in.
  const liveTimes = new Map(diary.day.planned.map((meal) => [meal.slot, meal.time]));
  const today = { ...planToday, meals: planToday.meals.map((meal) => ({ ...meal, time: liveTimes.get(meal.slot) ?? meal.time })) };
  const fastTimes = diary.day.fastTimes ?? planToday.fastTimes;
  // How much of today has been ticked off, shown on the food diary button.
  const plannedCount = diary.day.planned.length;
  const logged = diary.day.planned.filter((meal) => meal.status !== null).length;
  const tomorrow = days[(dayIndex + 1) % days.length]!;

  const upcomingIndex =
    minutes === null ? -1 : today.meals.findIndex((meal) => minutesFromTime(meal.time) + MEAL_WINDOW > minutes);
  const allDone = minutes !== null && upcomingIndex === -1;
  const featured = allDone ? tomorrow.meals[0]! : upcomingIndex >= 0 ? today.meals[upcomingIndex]! : null;
  const isNow = featured !== null && !allDone && minutes !== null && minutes >= minutesFromTime(featured.time);

  return (
    <section aria-labelledby="today-heading" className="surface p-5 sm:p-6" data-print="hide">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Today</p>
          <h2 id="today-heading" className="mt-1 text-lg font-bold text-ink sm:text-xl">
            {formatDayLong(todayKey)}
          </h2>
          {today.kind === 'vrat' ? (
            <p className="mt-1 text-[0.8125rem] font-semibold text-saffron-800">Vrat day</p>
          ) : today.kind === 'ramadan' && fastTimes ? (
            <p className="mt-1 text-[0.8125rem] font-semibold text-water-700">
              Sehri ends {formatClock(fastTimes.sehriEnds)} · Iftar {formatClock(fastTimes.iftar)}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 ? (
            <p className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-saffron-50 px-3 text-xs font-bold text-saffron-800 ring-1 ring-inset ring-saffron-200">
              <Flame className="size-3.5" aria-hidden="true" />
              {streak}-day streak
            </p>
          ) : null}
          <Link
            href="/diary"
            aria-label={`Food diary — ${logged} of ${plannedCount} meals logged today`}
            className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-3 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-surface-3 hover:ring-line-strong"
          >
            <NotebookPen className="size-4 text-brand-700" aria-hidden="true" />
            Food diary
            {plannedCount > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums',
                  logged === plannedCount ? 'bg-brand-50 text-brand-800' : 'bg-surface-3 text-muted',
                )}
              >
                {logged}/{plannedCount}
              </span>
            ) : null}
            <ArrowRight
              className="size-4 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      {/* Up next */}
      <div className="mt-5 min-w-0">
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
                isNow ? 'bg-accent text-accent-ink' : 'bg-brand-50 text-brand-800',
              )}
            >
              {allDone ? 'Tomorrow' : isNow ? 'Now' : 'Up next'} · {mealLabel(featured)} · {featured.time}
            </p>
            <div className="mt-3 flex gap-4">
              <MealPhoto slug={featured.slug} slot={featured.slot} className="size-20 sm:size-24" sizes="96px" eager />
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-snug text-ink sm:text-lg">
                  <Link
                    href={recipeHref(featured)}
                    className="-my-3 inline-block rounded-sm py-3 decoration-accent decoration-2 underline-offset-4 hover:underline"
                  >
                    {featured.name}
                    <span className="sr-only"> — recipe</span>
                  </Link>
                </h3>
                <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted">
                  {featured.items.map((item) => formatItem(item)).join(' · ')}
                </p>
                <MacroLine meal={featured} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What has really been eaten — from the check-ins and foods below, never from the clock */}
      <div className="mt-5 border-t border-line pt-5">
        <EatenSummary eaten={diary.day.eaten} targets={diary.day.targets ?? targets} planned={today.totals.kcal} />
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <h3 className="mb-3 text-sm font-bold text-ink">What did you eat?</h3>
        <DiaryMeals diary={diary} canLog />
      </div>
    </section>
  );
}
