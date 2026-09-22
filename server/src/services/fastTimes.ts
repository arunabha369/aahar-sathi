import { cityFor } from '../data/cities.ts';
import { ramadanTimes } from './almanac.ts';
import { ramadanMealTimes } from './planGenerator.ts';
import type { PlanDay, PlanInputs } from '../types.ts';

/**
 * A plan day as it applies on a real date. Sehri and iftar move by a minute or so a day,
 * so a Ramadan plan kept for more than its first week gets that date's times (and meal
 * times built from them), not the week it was made.
 */
export function onDate(day: PlanDay, date: string, inputs: Pick<PlanInputs, 'preferences'>): PlanDay {
  if (day.kind !== 'ramadan') return day;
  const fastTimes = ramadanTimes(date, cityFor(inputs.preferences?.city));
  const clock = ramadanMealTimes(fastTimes) ?? {};
  return {
    ...day,
    fastTimes,
    meals: day.meals.map((meal) => ({ ...meal, time: clock[meal.slot] ?? meal.time })),
  };
}
