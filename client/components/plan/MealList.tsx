'use client';

import Link from 'next/link';
import { BookOpen, RefreshCw, Repeat2 } from 'lucide-react';
import { FastDayNote } from '@/components/plan/FastDayNote';
import { ProteinBoost } from '@/components/plan/ProteinBoost';
import { MacroLine } from '@/components/plan/MacroLine';
import { MealPhoto } from '@/components/plan/MealPhoto';
import { formatItem } from '@/lib/format';
import { mealLabel, recipeHref } from '@/lib/meals';
import type { Diet, PlanDay, PlanSlot, Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MealListProps {
  day: PlanDay;
  targets: Targets;
  diet: Diet;
  onSwap?: (slot: PlanSlot) => void;
  swappingSlots?: PlanSlot[];
  /** For the Ramadan note: where the sehri and iftar times were calculated for. */
  cityName?: string | null;
}

export function MealList({ day, targets, diet, onSwap, swappingSlots = [], cityName }: MealListProps) {
  const drift = day.totals.kcal - targets.calories;
  const withinTarget = Math.abs(drift) <= targets.calories * 0.1;

  return (
    <div>
      <FastDayNote kind={day.kind} fastTimes={day.fastTimes} cityName={cityName} />
      <ol className="overflow-hidden rounded-2xl border border-line bg-surface" data-print="card">
        {day.meals.map((meal, index) => {
          const label = mealLabel(meal);
          const swapping = swappingSlots.includes(meal.slot);

          return (
            <li
              key={meal.slot}
              className={cn(
                // Phones: dish on top, macros + Swap share a full-width row underneath.
                // sm and up: photo | details | Swap, with the macros under the details.
                'grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3.5 gap-y-2.5 px-4 py-4 transition-colors sm:px-5',
                index > 0 && 'border-t border-line',
                swapping ? 'opacity-60' : 'hover:bg-surface-2/60 focus-within:bg-surface-2/60',
              )}
            >
              <div className="col-start-1 row-start-1 flex flex-col items-center gap-1.5 pt-0.5 sm:row-[1/3]">
                <MealPhoto slug={meal.slug} slot={meal.slot} region={meal.region} className="size-14 sm:size-16" sizes="64px" />
                <span className="text-[0.625rem] font-bold text-muted tabular-nums">{meal.time}</span>
              </div>

              <div className="col-span-2 col-start-2 row-start-1 min-w-0 sm:col-span-1">
                <p className="eyebrow">{label}</p>
                <h4 className="mt-0.5 text-[0.9375rem] font-bold leading-snug text-ink">
                  {swapping ? (
                    'Finding another dish…'
                  ) : (
                    <Link
                      href={recipeHref(meal)}
                      className="group/recipe -my-3 inline-block rounded-sm py-3 decoration-accent decoration-2 underline-offset-4 hover:underline"
                    >
                      {meal.name}
                      <BookOpen
                        className="ml-1.5 inline size-3.5 align-[-0.1em] text-muted transition-colors group-hover/recipe:text-accent"
                        aria-hidden="true"
                      />
                      <span className="sr-only"> — recipe</span>
                    </Link>
                  )}
                </h4>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
                  {meal.items.map((item) => formatItem(item)).join(' · ')}
                </p>
                {meal.portions?.length ? (
                  <ul className="mt-1.5 space-y-0.5 text-[0.75rem] leading-relaxed text-muted">
                    {meal.portions.map((portion) => (
                      <li key={portion.memberId}>
                        <span className="font-semibold text-ink-soft">{portion.name}:</span>{' '}
                        {portion.items.map((item) => formatItem(item)).join(' · ')}{' '}
                        <span className="tabular-nums">({portion.kcal} kcal)</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <MacroLine
                meal={meal}
                className="col-span-2 col-start-1 row-start-2 self-center sm:col-span-1 sm:col-start-2"
              />

              {onSwap ? (
                <button
                  type="button"
                  onClick={() => onSwap(meal.slot)}
                  disabled={swapping}
                  data-print="hide"
                  className="col-start-3 row-start-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 self-center rounded-xl px-3 text-[0.8125rem] font-semibold text-ink-soft ring-1 ring-line transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-60 sm:row-[1/3]"
                  aria-label={`Swap ${label.toLowerCase()} on ${day.day}`}
                >
                  {swapping ? (
                    <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Repeat2 className="size-4" aria-hidden="true" />
                  )}
                  {/* Icon-only on phones (the aria-label names it); labelled from sm up. */}
                  <span className="hidden sm:inline">Swap</span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-line" aria-live="polite">
        <p className="text-sm font-semibold text-ink">
          Day total <span className="tabular-nums">{day.totals.kcal.toLocaleString('en-IN')} kcal</span>
          <span className="ml-1.5 font-normal text-muted">
            vs {targets.calories.toLocaleString('en-IN')} target
          </span>
          <span
            className={cn(
              'ml-2 rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums',
              withinTarget ? 'bg-brand-50 text-brand-800' : 'bg-saffron-50 text-saffron-800',
            )}
          >
            {drift >= 0 ? '+' : ''}
            {drift}
          </span>
        </p>
        <p className="text-[0.8125rem] font-semibold text-muted tabular-nums">
          P {day.totals.protein} g · C {day.totals.carbs} g · F {day.totals.fat} g
        </p>
      </div>

      <div className="mt-3">
        <ProteinBoost
          dayProtein={day.totals.protein}
          targetProtein={targets.protein}
          diet={diet}
          vrat={day.kind === 'vrat'}
        />
      </div>
    </div>
  );
}
