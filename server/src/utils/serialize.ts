import type { PlanRecord } from '../db/plans.ts';
import type { UserRecord } from '../db/users.ts';
import type { Profile } from '../types.ts';

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
  isActive: boolean;
  createdAt: string;
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
    isActive: plan.isActive,
    createdAt: new Date(plan.createdAt).toISOString(),
  };
}
