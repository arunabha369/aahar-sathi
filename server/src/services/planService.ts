import type { HydratedDocument, Types } from 'mongoose';
import { Meal } from '../models/Meal.js';
import { Plan, type PlanDoc } from '../models/Plan.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateTargets } from './nutrition.js';
import { generatePlanDays, type PlannerMeal } from './planGenerator.js';
import type { Profile } from '../types.js';

/** Loads the meal database in the shape the generator wants. */
export async function loadPlannerMeals(): Promise<PlannerMeal[]> {
  const meals = await Meal.find().lean();
  if (meals.length === 0) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'The meal database is empty. Run `npm run seed` first.');
  }
  return meals.map((meal) => ({
    id: meal._id.toString(),
    slug: meal.slug,
    name: meal.name,
    slot: meal.slot,
    diet: meal.diet,
    region: meal.region,
    items: meal.items,
    kcal: meal.kcal,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    ingredients: meal.ingredients,
  }));
}

export interface CreatePlanOptions {
  userId: Types.ObjectId;
  profile: Profile;
  random?: () => number;
}

/** Generates a fresh 7-day plan and makes it the user's active one. */
export async function createPlanForUser({
  userId,
  profile,
  random,
}: CreatePlanOptions): Promise<HydratedDocument<PlanDoc>> {
  const meals = await loadPlannerMeals();
  const targets = calculateTargets(profile);
  const days = generatePlanDays({ profile, targets, meals, ...(random ? { random } : {}) });

  await Plan.updateMany({ user: userId, isActive: true }, { $set: { isActive: false } });

  return Plan.create({
    user: userId,
    inputs: profile,
    targets,
    days,
    groceryChecked: [],
    isActive: true,
  });
}
