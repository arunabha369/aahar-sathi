import { listMeals } from '../db/meals.js';
import { insertActivePlan, type PlanRecord } from '../db/plans.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateTargets } from './nutrition.js';
import { generatePlanDays, type PlannerMeal } from './planGenerator.js';
import type { Profile } from '../types.js';

/** Loads the meal database in the shape the generator wants. */
export async function loadPlannerMeals(): Promise<PlannerMeal[]> {
  const meals = await listMeals();
  if (meals.length === 0) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'The meal database is empty. Run `npm run seed` first.');
  }
  return meals;
}

export interface CreatePlanOptions {
  userId: string;
  profile: Profile;
  random?: () => number;
}

/** Generates a fresh 7-day plan and makes it the user's active one. */
export async function createPlanForUser({ userId, profile, random }: CreatePlanOptions): Promise<PlanRecord> {
  const meals = await loadPlannerMeals();
  const targets = calculateTargets(profile);
  const days = generatePlanDays({ profile, targets, meals, ...(random ? { random } : {}) });

  return insertActivePlan({ userId, inputs: profile, targets, days });
}
