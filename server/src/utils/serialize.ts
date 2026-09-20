import type { Types } from 'mongoose';
import type { PlanDoc } from '../models/Plan.js';
import type { UserDoc } from '../models/User.js';
import type { Profile } from '../types.js';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  profile: Partial<Profile>;
  profileComplete: boolean;
  createdAt: string;
}

type UserLike = Pick<UserDoc, 'name' | 'email' | 'profile' | 'profileComplete' | 'createdAt'> & {
  _id: Types.ObjectId;
};

export function toPublicUser(user: UserLike): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    profile: user.profile ?? {},
    profileComplete: user.profileComplete,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

export interface PublicPlan {
  id: string;
  inputs: PlanDoc['inputs'];
  targets: PlanDoc['targets'];
  days: PlanDoc['days'];
  groceryChecked: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPublicPlan(plan: PlanDoc): PublicPlan {
  return {
    id: plan._id.toString(),
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
  goal: PlanDoc['inputs']['goal'];
  diet: PlanDoc['inputs']['diet'];
  cuisine: PlanDoc['inputs']['cuisine'];
  calories: number;
  protein: number;
  bmi: number;
  bmiCategory: PlanDoc['targets']['bmiCategory'];
  isActive: boolean;
  createdAt: string;
}

export function toPlanSummary(plan: PlanDoc): PlanSummary {
  return {
    id: plan._id.toString(),
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
