import type { HouseholdMember } from '../db/household.ts';
import { calculateTargets } from './nutrition.ts';
import { portionFactors, scaleFactor, scaleQuantity } from './planGenerator.ts';
import type {
  Diet,
  HouseholdMemberSnapshot,
  MealData,
  PlanDay,
  PlanPreferences,
  Profile,
} from '../types.ts';

const DIET_RANK: Record<Diet, number> = { veg: 0, egg: 1, nonveg: 2 };

/** The household eats one menu, so it follows the strictest diet at the table. */
export function strictestDiet(diets: Diet[]): Diet {
  return diets.reduce((strictest, diet) => (DIET_RANK[diet] < DIET_RANK[strictest] ? diet : strictest));
}

export interface HouseholdShape {
  diet: Diet;
  jain: boolean;
  members: HouseholdMemberSnapshot[];
}

/** What a household plan is built around: the shared diet, and each member's own calorie target. */
export function householdShape(owner: Profile, preferences: PlanPreferences, members: HouseholdMember[]): HouseholdShape {
  return {
    diet: strictestDiet([owner.diet, ...members.map((member) => member.profile.diet)]),
    jain: preferences.jain || members.some((member) => member.profile.jain),
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
      calories: calculateTargets({ ...member.profile, cuisine: owner.cuisine }).calories,
    })),
  };
}

/**
 * Adds each member's portion to every meal: the owner's portion scaled by the ratio of
 * their calorie targets, snapped to a size the dish can really be served at (whole rotis).
 */
export function withHouseholdPortions(
  days: PlanDay[],
  ownerCalories: number,
  members: HouseholdMemberSnapshot[],
  mealsBySlug: Map<string, MealData>,
): PlanDay[] {
  return days.map((day) => ({
    ...day,
    meals: day.meals.map((meal) => {
      const { portions: _previous, ...rest } = meal;
      const base = mealsBySlug.get(meal.slug);
      if (!base || members.length === 0) return rest;
      const factors = portionFactors(base);
      return {
        ...rest,
        portions: members.map((member) => {
          const wanted = meal.factor * (member.calories / ownerCalories);
          const factor = scaleFactor(wanted * base.kcal, base.kcal, factors);
          return {
            memberId: member.id,
            name: member.name,
            factor,
            items: base.items.map((item) => ({ ...item, qty: scaleQuantity(item, factor) })),
            kcal: Math.round(base.kcal * factor),
          };
        }),
      };
    }),
  }));
}
