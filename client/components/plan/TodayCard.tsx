'use client';

import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { MacroLine } from '@/components/plan/MacroLine';
import { MealPhoto } from '@/components/plan/MealPhoto';
import { Skeleton } from '@/components/ui/Skeleton';
import { MACRO_COLORS, SLOT_META } from '@/lib/constants';
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

type Status = 'ok' | 'low' | 'high' | 'under';

function statusOf(value: number, target: number, lowAt?: number): Status {
  const ratio = target > 0 ? value / target : 0;
  return lowAt !== undefined && ratio < lowAt ? 'low' : ratio > 1.15 ? 'high' : ratio >= 0.9 ? 'ok' : 'under';
}

/** `compact` lets the label wrap and drops "of target", for the narrow macro tiles. */
function StatusBadge({ status, ratio, compact = false }: { status: Status; ratio: number; compact?: boolean }) {
  const wrap = compact ? '' : 'whitespace-nowrap';
  if (status === 'ok') {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-[0.6875rem] font-bold text-brand-700', wrap)}>
        <Check className="size-3 shrink-0" strokeWidth={3} aria-hidden="true" /> On target
      </span>
    );
  }
  if (status === 'low' || status === 'high') {
    const Arrow = status === 'low' ? ArrowDown : ArrowUp;
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-[0.6875rem] font-bold text-saffron-700', wrap)}>
        <Arrow className="size-3 shrink-0" strokeWidth={3} aria-hidden="true" /> {status === 'low' ? 'Low' : 'High'}
      </span>
    );
  }
  return (
    <span className={cn('text-[0.6875rem] font-bold text-muted tabular-nums', wrap)}>
      {Math.round(ratio * 100)}%{compact ? '' : ' of target'}
    </span>
  );
}

/** Macro tile: planned grams against target, with a thin bar in the macro's colour. */
function MacroTile({
  label,
  value,
  target,
  color,
  lowAt,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  /** Below this share of target the tile reads "Low"; undefined means no low warning. */
  lowAt?: number;
}) {
  const ratio = target > 0 ? value / target : 0;

  return (
    <div className="min-w-0 rounded-2xl bg-surface-2 p-2.5 sm:p-3">
      <dt className="flex items-center gap-1 text-xs font-semibold text-muted sm:gap-1.5">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5">
        <span className="block text-lg font-extrabold leading-none text-ink tabular-nums">{value} g</span>
        <span className="mt-0.5 block text-xs font-semibold text-muted tabular-nums">of {target} g</span>
        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.min(100, ratio * 100)}%`, backgroundColor: color }}
          />
        </span>
        <span className="mt-1.5 block">
          <StatusBadge status={statusOf(value, target, lowAt)} ratio={ratio} compact />
        </span>
      </dd>
    </div>
  );
}

/** The calorie ring: how much of today's plan is still ahead of you by the clock. */
function CalorieRing({ planned, done, ready }: { planned: number; done: number; ready: boolean }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const share = planned > 0 ? Math.min(1, done / planned) : 0;
  const left = Math.max(0, planned - done);

  return (
    <div className="relative size-36 shrink-0 sm:size-40">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-surface-3" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - share)}
          className={cn('stroke-accent transition-[stroke-dashoffset] duration-700', share === 0 && 'opacity-0')}
        />
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[1.75rem] font-extrabold leading-none tracking-tight text-ink tabular-nums sm:text-[2rem]">
          {ready ? left.toLocaleString('en-IN') : planned.toLocaleString('en-IN')}
        </span>
        <span className="mt-1 text-xs font-semibold text-muted">{ready ? 'kcal left today' : 'kcal planned'}</span>
      </p>
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
  // Meals whose time has come count as behind you; the ring shows what is still ahead.
  const doneKcal =
    minutes === null
      ? 0
      : today.meals.filter((meal) => minutesFromTime(meal.time) <= minutes).reduce((sum, meal) => sum + meal.kcal, 0);

  return (
    <section aria-labelledby="today-heading" className="surface p-5 sm:p-6" data-print="hide">
      <p className="eyebrow">Today</p>
      <h2 id="today-heading" className="mt-1 text-lg font-bold text-ink sm:text-xl">
        {formatDayLong(todayKey)}
      </h2>

      <div className="mt-5">
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
                  isNow ? 'bg-accent text-accent-ink' : 'bg-brand-50 text-brand-800',
                )}
              >
                {allDone ? 'Tomorrow' : isNow ? 'Now' : 'Up next'} · {SLOT_META[featured.slot].label} · {featured.time}
              </p>
              <div className="mt-3 flex gap-4">
                <MealPhoto slug={featured.slug} slot={featured.slot} className="size-20 sm:size-24" sizes="96px" eager />
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
                      passed ? 'bg-accent' : current ? 'bg-brand-300' : 'bg-line',
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
        <div className="mt-5 grid gap-4 border-t border-line pt-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6">
          <div>
          <div className="flex items-center gap-5">
            <CalorieRing planned={today.totals.kcal} done={doneKcal} ready={minutes !== null} />
            <dl className="min-w-0 space-y-3 text-[0.8125rem]">
              <div>
                <dt className="font-semibold text-muted">Planned today</dt>
                <dd className="font-bold text-ink tabular-nums">{today.totals.kcal.toLocaleString('en-IN')} kcal</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted">Your target</dt>
                <dd className="font-bold text-ink tabular-nums">{targets.calories.toLocaleString('en-IN')} kcal</dd>
              </div>
              <div>
                <dt className="sr-only">Plan against target</dt>
                <dd>
                  <StatusBadge
                    status={statusOf(today.totals.kcal, targets.calories)}
                    ratio={targets.calories > 0 ? today.totals.kcal / targets.calories : 0}
                  />
                </dd>
              </div>
            </dl>
          </div>
          <p className="mt-2 text-xs text-muted">The ring fills as each meal time passes.</p>
          </div>

          <dl className="grid grid-cols-3 gap-2">
            <MacroTile label="Protein" value={today.totals.protein} target={targets.protein} color={MACRO_COLORS.protein} lowAt={0.85} />
            <MacroTile label="Carbs" value={today.totals.carbs} target={targets.carbs} color={MACRO_COLORS.carbs} />
            <MacroTile label="Fat" value={today.totals.fat} target={targets.fat} color={MACRO_COLORS.fat} />
          </dl>
        </div>
      </div>
    </section>
  );
}
