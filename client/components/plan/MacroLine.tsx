import type { PlanMeal } from '@/lib/types';

/**
 * kcal as a pill, then protein / carbs / fat as coloured text — one line that fits
 * a phone-width meal row, where four padded chips would wrap.
 */
export function MacroLine({ meal, className = 'mt-2' }: { meal: PlanMeal; className?: string }) {
  return (
    <p className={`${className} flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-2.5 text-[0.8125rem] font-semibold tabular-nums`}>
      <span className="rounded-md bg-ink px-1.5 py-0.5 text-[0.75rem] font-bold text-canvas">{meal.kcal} kcal</span>
      <span className="whitespace-nowrap text-protein">P {meal.protein} g</span>
      <span className="whitespace-nowrap text-carbs">C {meal.carbs} g</span>
      <span className="whitespace-nowrap text-fat">F {meal.fat} g</span>
    </p>
  );
}
