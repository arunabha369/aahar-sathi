'use client';

import { RefreshCw, Repeat2 } from 'lucide-react';
import { ProteinBoost } from '@/components/plan/ProteinBoost';
import { SlotIcon } from '@/components/illustrations/SlotIcon';
import { SLOT_META } from '@/lib/constants';
import { formatItem } from '@/lib/format';
import type { Diet, PlanDay, PlanSlot, Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MealListProps {
  day: PlanDay;
  targets: Targets;
  diet: Diet;
  onSwap?: (slot: PlanSlot) => void;
  swappingSlots?: PlanSlot[];
}

function MacroChip({ letter, grams, className }: { letter: string; grams: number; className: string }) {
  return (
    <span className={cn('rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums', className)}>
      {letter} {grams}g
    </span>
  );
}

export function MealList({ day, targets, diet, onSwap, swappingSlots = [] }: MealListProps) {
  const drift = day.totals.kcal - targets.calories;
  const withinTarget = Math.abs(drift) <= targets.calories * 0.1;

  return (
    <div>
      <ol className="overflow-hidden rounded-2xl border border-line bg-white" data-print="card">
        {day.meals.map((meal, index) => {
          const slot = SLOT_META[meal.slot];
          const swapping = swappingSlots.includes(meal.slot);

          return (
            <li
              key={meal.slot}
              className={cn(
                'group relative flex items-start gap-3.5 px-4 py-4 transition-colors sm:px-5',
                index > 0 && 'border-t border-line',
                swapping ? 'opacity-60' : 'hover:bg-canvas/70',
              )}
            >
              <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
                <SlotIcon slot={meal.slot} className="size-9" />
                <span className="text-[0.625rem] font-bold text-muted tabular-nums">{meal.time}</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="eyebrow">{slot.label}</p>
                <h4 className="mt-0.5 text-[0.9375rem] font-bold leading-snug text-ink">
                  {swapping ? 'Finding another dish…' : meal.name}
                </h4>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
                  {meal.items.map((item) => formatItem(item)).join(' · ')}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-ink px-1.5 py-0.5 text-[0.6875rem] font-bold text-white tabular-nums">
                    {meal.kcal} kcal
                  </span>
                  <MacroChip letter="P" grams={meal.protein} className="bg-orange-50 text-orange-700" />
                  <MacroChip letter="C" grams={meal.carbs} className="bg-blue-50 text-blue-700" />
                  <MacroChip letter="F" grams={meal.fat} className="bg-yellow-50 text-yellow-800" />
                </div>
              </div>

              {onSwap ? (
                <button
                  type="button"
                  onClick={() => onSwap(meal.slot)}
                  disabled={swapping}
                  data-print="hide"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-center rounded-xl px-3 text-[0.8125rem] font-semibold text-ink-soft ring-1 ring-line transition-colors hover:bg-canvas hover:text-ink disabled:opacity-60"
                  aria-label={`Swap ${slot.label.toLowerCase()} on ${day.day}`}
                >
                  {swapping ? (
                    <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Repeat2 className="size-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">Swap</span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-3 ring-1 ring-line">
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
        <ProteinBoost dayProtein={day.totals.protein} targetProtein={targets.protein} diet={diet} />
      </div>
    </div>
  );
}
