import type { PlanRecord } from '../db/plans.ts';
import type { UserRecord } from '../db/users.ts';
import type { FastingMode, Profile } from '../types.ts';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  profile: Partial<Profile>;
  profileComplete: boolean;
  createdAt: string;
}

/** Builds the response field by field, so a password hash can never ride along. */
export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile ?? {},
    profileComplete: user.profileComplete,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

export interface PublicPlan {
  id: string;
  inputs: PlanRecord['inputs'];
  targets: PlanRecord['targets'];
  days: PlanRecord['days'];
  groceryChecked: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPublicPlan(plan: PlanRecord): PublicPlan {
  return {
    id: plan.id,
    inputs: plan.inputs,
    targets: plan.targets,
    days: plan.days,
    groceryChecked: plan.groceryChecked ?? [],
    isActive: plan.isActive,
    createdAt: new Date(plan.createdAt).toISOString(),
    updatedAt: new Date(plan.updatedAt).toISOString(),
  };
}

export interface PlanSummary {
  id: string;
  goal: PlanRecord['inputs']['goal'];
  diet: PlanRecord['inputs']['diet'];
  cuisine: PlanRecord['inputs']['cuisine'];
  calories: number;
  protein: number;
  bmi: number;
  bmiCategory: PlanRecord['targets']['bmiCategory'];
  fasting: FastingMode;
  jain: boolean;
  /** People the plan feeds: the user plus their household. */
  people: number;
  /** A taste of the week, so two plans with the same targets can be told apart. */
  dishes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPlanSummary(plan: PlanRecord): PlanSummary {
  return {
    id: plan.id,
    goal: plan.inputs.goal,
    diet: plan.inputs.diet,
    cuisine: plan.inputs.cuisine,
    calories: plan.targets.calories,
    protein: plan.targets.protein,
    bmi: plan.targets.bmi,
    bmiCategory: plan.targets.bmiCategory,
    fasting: plan.inputs.preferences?.fasting ?? 'none',
    jain: plan.inputs.preferences?.jain ?? false,
    people: 1 + (plan.inputs.household?.length ?? 0),
    dishes: planDishes(plan),
    isActive: plan.isActive,
    createdAt: new Date(plan.createdAt).toISOString(),
    updatedAt: new Date(plan.updatedAt).toISOString(),
  };
}

/** The week's lunches and dinners, first few distinct ones. */
function planDishes(plan: PlanRecord): string[] {
  const names = plan.days.flatMap((day) =>
    day.meals.filter((meal) => meal.slot === 'lunch' || meal.slot === 'dinner').map((meal) => meal.name),
  );
  return [...new Set(names)].slice(0, 3);
}
