import { SLOT_META } from '@/lib/constants';
import type { PlanMeal, PlanSlot } from '@/lib/types';

/** The meal's name for its slot: "Lunch", or on fast days "Sehri" / "Iftar". */
export function mealLabel(meal: { slot: PlanSlot; label?: string | undefined }): string {
  return meal.label ?? SLOT_META[meal.slot].label;
}

/**
 * The recipe for a planned meal, opened at the amount the plan cooks: the user's portion
 * plus every household member's.
 */
export function recipeHref(meal: Pick<PlanMeal, 'slug' | 'factor' | 'portions'>): string {
  const portions = meal.portions ?? [];
  const servings = Math.round((meal.factor + portions.reduce((sum, portion) => sum + portion.factor, 0)) * 100) / 100;
  if (servings === 1 && portions.length === 0) return `/recipes/${meal.slug}`;
  const params = new URLSearchParams({ servings: String(servings) });
  if (portions.length > 0) params.set('people', String(portions.length + 1));
  return `/recipes/${meal.slug}?${params.toString()}`;
}
