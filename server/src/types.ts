export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export const ACTIVITIES = ['sedentary', 'light', 'moderate', 'active', 'athlete'] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const GOALS = ['loss', 'maintain', 'gain'] as const;
export type Goal = (typeof GOALS)[number];

export const DIETS = ['veg', 'egg', 'nonveg'] as const;
export type Diet = (typeof DIETS)[number];

export const CUISINES = ['north', 'south', 'east', 'west', 'mix'] as const;
export type Cuisine = (typeof CUISINES)[number];

/** Regions a meal can belong to. `pan` means it is eaten all over India. */
export const REGIONS = ['north', 'south', 'east', 'west', 'pan'] as const;
export type Region = (typeof REGIONS)[number];

/** Slots the meal database is organised by. */
export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

/** Slots a generated day is made of (two of them are filled with `snack` meals). */
export const PLAN_SLOTS = ['breakfast', 'midMorning', 'lunch', 'eveningSnack', 'dinner'] as const;
export type PlanSlot = (typeof PLAN_SLOTS)[number];

export const INGREDIENT_CATEGORIES = [
  'Grains & Flours',
  'Lentils & Legumes',
  'Dairy & Paneer',
  'Eggs',
  'Meat & Fish',
  'Vegetables & Fruits',
  'Nuts, Seeds & Oils',
  'Spices & Others',
] as const;
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export const BMI_CATEGORIES = ['Underweight', 'Normal', 'Overweight', 'Obese'] as const;
export type BmiCategory = (typeof BMI_CATEGORIES)[number];

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

export interface MealItem {
  qty: number;
  unit: string;
  food: string;
}

export interface MealIngredient {
  name: string;
  category: IngredientCategory;
}

export interface MealData {
  slug: string;
  name: string;
  slot: MealSlot;
  diet: Diet;
  region: Region;
  items: MealItem[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: MealIngredient[];
}

/** A meal as stored inside a plan: a snapshot, so editing the meal database never rewrites history. */
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

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const SLOT_META: Record<PlanSlot, { label: string; emoji: string; time: string; share: number }> = {
  breakfast: { label: 'Breakfast', emoji: '☀️', time: '7:00 AM', share: 0.25 },
  midMorning: { label: 'Mid-Morning Snack', emoji: '🍎', time: '10:30 AM', share: 0.1 },
  lunch: { label: 'Lunch', emoji: '🍱', time: '1:00 PM', share: 0.3 },
  eveningSnack: { label: 'Evening Snack', emoji: '☕', time: '4:30 PM', share: 0.1 },
  dinner: { label: 'Dinner', emoji: '🌙', time: '7:30 PM', share: 0.25 },
};

export const ACTIVITY_MULTIPLIERS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};
