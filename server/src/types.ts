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

/**
 * What a dish is suitable for. `vrat` and `jain` are worked out from the recipe;
 * `fastOnly` dishes (kuttu roti, samak pulao…) are only planned on fast days; `sehri` and
 * `iftar` mark the dishes a Ramadan day is built from.
 */
export const MEAL_TAGS = ['vrat', 'jain', 'fastOnly', 'sehri', 'iftar'] as const;
export type MealTag = (typeof MEAL_TAGS)[number];

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
  tags?: MealTag[];
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
  /** Replaces the slot's usual name on fast days ("Sehri", "Iftar"). */
  label?: string;
  /** Household plans: how much each family member eats of this dish. */
  portions?: MemberPortion[];
}

export interface MemberPortion {
  memberId: string;
  name: string;
  factor: number;
  items: MealItem[];
  kcal: number;
}

export interface DayTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A normal day, a vrat (Navratri, Ekadashi) or a Ramadan fast (sehri, iftar, dinner). */
export const DAY_KINDS = ['normal', 'vrat', 'ramadan'] as const;
export type DayKind = (typeof DAY_KINDS)[number];

export interface PlanDay {
  day: string;
  meals: PlanMeal[];
  totals: DayTotals;
  /** Absent on plans made before fasting modes existed, which means a normal day. */
  kind?: DayKind;
  /** Ramadan days: the calculated end of sehri (dawn) and iftar (sunset), "HH:MM", with the date used. */
  fastTimes?: { date: string; sehriEnds: string; iftar: string };
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

export const FASTING_MODES = ['none', 'navratri', 'ekadashi', 'ramadan'] as const;
export type FastingMode = (typeof FASTING_MODES)[number];

/** How the plan is shaped beyond the profile itself. Stored with the user and snapshotted into each plan. */
export interface PlanPreferences {
  /** No onion, garlic, root vegetables, eggs or meat. */
  jain: boolean;
  fasting: FastingMode;
  /** Ekadashi (or any weekly vrat): which days of the plan week are fast days. */
  vratDays: Weekday[];
  /** For sehri and iftar times, and Ekadashi sunrise. */
  city: string | null;
}

export const DEFAULT_PREFERENCES: PlanPreferences = { jain: false, fasting: 'none', vratDays: [], city: null };

/** Everything kept in users.preferences: the plan shaping, plus the accepted calorie adjustment. */
export interface UserPreferences extends PlanPreferences {
  /** kcal added to (or taken from) the calculated target, from an accepted weight-trend suggestion. */
  calorieAdjustment: number;
  calorieAdjustedAt: string | null;
  /** When the user last said "not now" to a suggestion; it stays quiet for a while after. */
  suggestionDismissedAt: string | null;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  ...DEFAULT_PREFERENCES,
  calorieAdjustment: 0,
  calorieAdjustedAt: null,
  suggestionDismissedAt: null,
};

/** A household member as a plan remembers them: enough to label portions. */
export interface HouseholdMemberSnapshot {
  id: string;
  name: string;
  calories: number;
}

/** What a plan was made from: the profile, and (for newer plans) how it was shaped. */
export interface PlanInputs extends Profile {
  preferences?: PlanPreferences;
  calorieAdjustment?: number;
  household?: HouseholdMemberSnapshot[];
}

/** A household member's details: the profile without a cuisine (the menu is shared), plus Jain. */
export interface MemberProfile extends Omit<Profile, 'cuisine'> {
  jain: boolean;
}

/** Which reminders to send, as clock times in the user's own timezone ("HH:MM"). */
export interface ReminderSettings {
  water: { enabled: boolean; everyMinutes: 60 | 90 | 120 | 180; from: string; to: string };
  meals: { enabled: boolean; minutesBefore: 0 | 15 | 30 };
  weighIn: { enabled: boolean; time: string; days: Weekday[] };
  bedtime: { enabled: boolean; time: string };
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  water: { enabled: true, everyMinutes: 120, from: '09:00', to: '21:00' },
  meals: { enabled: true, minutesBefore: 0 },
  weighIn: { enabled: true, time: '07:30', days: ['Mon'] },
  bedtime: { enabled: false, time: '22:30' },
};
