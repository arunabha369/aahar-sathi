/** Response types for the Express API. These mirror server/src/types.ts. */

export type Gender = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type Goal = 'loss' | 'maintain' | 'gain';
export type Diet = 'veg' | 'egg' | 'nonveg';
export type Cuisine = 'north' | 'south' | 'east' | 'west' | 'mix';
export type Region = 'north' | 'south' | 'east' | 'west' | 'pan';
export type PlanSlot = 'breakfast' | 'midMorning' | 'lunch' | 'eveningSnack' | 'dinner';
export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
export type IngredientCategory =
  | 'Grains & Flours'
  | 'Lentils & Legumes'
  | 'Dairy & Paneer'
  | 'Eggs'
  | 'Meat & Fish'
  | 'Vegetables & Fruits'
  | 'Nuts, Seeds & Oils'
  | 'Spices & Others';

export interface Profile {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
  diet: Diet;
  cuisine: Cuisine;
}

export interface Targets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterGlasses: number;
  bmi: number;
  bmiCategory: BmiCategory;
  notes: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile: Partial<Profile>;
  profileComplete: boolean;
  createdAt: string;
}

export interface MealItem {
  qty: number;
  unit: string;
  food: string;
}

export interface MealIngredient {
  name: string;
  category: IngredientCategory;
}

export interface PlanMeal {
  slot: PlanSlot;
  time: string;
  mealId: string;
  slug: string;
  name: string;
  diet: Diet;
  region: Region;
  factor: number;
  items: MealItem[];
  ingredients: MealIngredient[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PlanDay {
  day: string;
  meals: PlanMeal[];
  totals: DayTotals;
}

export interface Plan {
  id: string;
  inputs: Profile;
  targets: Targets;
  days: PlanDay[];
  groceryChecked: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanSummary {
  id: string;
  goal: Goal;
  diet: Diet;
  cuisine: Cuisine;
  calories: number;
  protein: number;
  bmi: number;
  bmiCategory: BmiCategory;
  isActive: boolean;
  createdAt: string;
}

export interface GroceryGroup {
  category: IngredientCategory;
  items: string[];
}

export interface WaterLog {
  date: string;
  glasses: number;
}

export interface WeightLog {
  date: string;
  weightKg: number;
}

/** One night, dated by the morning the user woke up. Times are 24-hour "HH:MM". */
export interface SleepLog {
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
}

/* ---- Response envelopes ---- */

export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
    details?: { field: string; message: string }[];
  };
}

export interface UserResponse {
  user: User;
}

export interface ProfileResponse {
  profile: Partial<Profile>;
  profileComplete: boolean;
  targets: Targets | null;
}

export interface ProfileUpdateResponse {
  user: User;
  profile: Profile;
  targets: Targets;
}

export interface PlanResponse {
  plan: Plan;
}

export interface ActivePlanResponse {
  plan: Plan | null;
}

export interface PlanListResponse {
  plans: PlanSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GroceryResponse {
  planId: string;
  groups: GroceryGroup[];
  total: number;
  checked: string[];
}

export interface GroceryUpdateResponse {
  checked: string[];
}

export interface WaterLogsResponse {
  from: string;
  to: string;
  logs: WaterLog[];
}

export interface WeightLogsResponse {
  from: string;
  to: string;
  logs: WeightLog[];
}

export interface SleepLogsResponse {
  from: string;
  to: string;
  logs: SleepLog[];
}

export interface OkResponse {
  ok: true;
}
