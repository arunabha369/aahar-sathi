import type { Activity, BmiCategory, Cuisine, Diet, Gender, Goal, PlanSlot } from '@/lib/types';

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  hint?: string;
}

export const ACTIVITY_OPTIONS: (Option<Activity> & { multiplier: number })[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little walking', multiplier: 1.2 },
  { value: 'light', label: 'Light', description: 'Daily walks or exercise 1–3 days a week', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderate', description: 'Gym 3–5 days a week', multiplier: 1.55 },
  { value: 'active', label: 'Active', description: 'Gym 6–7 days a week or a physical job', multiplier: 1.725 },
  { value: 'athlete', label: 'Athlete', description: 'Intense training every day', multiplier: 1.9 },
];

export const GOAL_OPTIONS: Option<Goal>[] = [
  { value: 'loss', label: 'Weight loss', description: '500 kcal below your daily burn' },
  { value: 'maintain', label: 'Maintain weight', description: 'Eat what you burn' },
  { value: 'gain', label: 'Muscle gain', description: '300 kcal above your daily burn' },
];

export const DIET_OPTIONS: Option<Diet>[] = [
  { value: 'veg', label: 'Vegetarian', description: 'No egg, no meat' },
  { value: 'egg', label: 'Eggetarian', description: 'Vegetarian plus eggs' },
  { value: 'nonveg', label: 'Non-vegetarian', description: 'Chicken, fish and meat too' },
];

export const CUISINE_OPTIONS: Option<Cuisine>[] = [
  { value: 'north', label: 'North Indian', description: 'Roti, rajma, paneer' },
  { value: 'south', label: 'South Indian', description: 'Idli, dosa, sambar' },
  { value: 'east', label: 'Eastern', description: 'Bengali and Odia favourites' },
  { value: 'west', label: 'Western', description: 'Gujarati and Maharashtrian' },
  { value: 'mix', label: 'A mix of everything', description: 'Dishes from all four' },
];

export const GENDER_OPTIONS: Option<Gender>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const SLOT_META: Record<PlanSlot, { label: string; short: string; time: string; share: number }> = {
  breakfast: { label: 'Breakfast', short: 'Breakfast', time: '7:00 AM', share: 0.25 },
  midMorning: { label: 'Mid-morning snack', short: 'Snack', time: '10:30 AM', share: 0.1 },
  lunch: { label: 'Lunch', short: 'Lunch', time: '1:00 PM', share: 0.3 },
  eveningSnack: { label: 'Evening snack', short: 'Snack', time: '4:30 PM', share: 0.1 },
  dinner: { label: 'Dinner', short: 'Dinner', time: '7:30 PM', share: 0.25 },
};

export const PLAN_SLOTS: PlanSlot[] = ['breakfast', 'midMorning', 'lunch', 'eveningSnack', 'dinner'];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const WEEKDAY_LABELS: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

/** Colour plus wording, so the category never depends on colour alone. */
export const BMI_BADGE: Record<BmiCategory, { className: string; note: string }> = {
  Underweight: {
    className: 'bg-saffron-50 text-saffron-800 ring-saffron-200',
    note: 'Below the healthy range for Indian adults',
  },
  Normal: {
    className: 'bg-brand-50 text-brand-800 ring-brand-200',
    note: 'In the healthy range for Indian adults',
  },
  Overweight: {
    className: 'bg-saffron-100 text-saffron-800 ring-saffron-300',
    note: 'Just above the healthy range — the Asian-Indian cut-off is 23',
  },
  Obese: {
    className: 'bg-red-50 text-chilli-700 ring-red-200',
    note: 'Above the healthy range — the Asian-Indian cut-off is 25',
  },
};

/**
 * Macro colours: orange, blue and yellow, stepped to 600 so all three clear the
 * lightness band and stay separable for colour-blind readers.
 */
export const MACRO_COLORS = {
  protein: '#ea580c',
  carbs: '#2563eb',
  fat: '#ca8a04',
} as const;

export const SERIES_COLORS = {
  calories: '#027a48',
  weight: '#7c3aed',
  water: '#0086c9',
} as const;

/** Easy add-ons shown when a day falls short on protein. */
export const PROTEIN_BOOSTERS = [
  { label: '1 cup curd', protein: 7, diets: ['veg', 'egg', 'nonveg'] as Diet[] },
  { label: '1 glass milk', protein: 7, diets: ['veg', 'egg', 'nonveg'] as Diet[] },
  { label: '30 g roasted chana', protein: 6, diets: ['veg', 'egg', 'nonveg'] as Diet[] },
  { label: '30 g soya chunks', protein: 15, diets: ['veg', 'egg', 'nonveg'] as Diet[] },
  { label: '2 boiled eggs', protein: 12, diets: ['egg', 'nonveg'] as Diet[] },
  { label: '100 g grilled chicken', protein: 31, diets: ['nonveg'] as Diet[] },
];

export const DISCLAIMER =
  'Aahar Sathi gives general guidance, not medical advice. If you are pregnant, breastfeeding, or managing diabetes, thyroid, kidney or heart conditions, please consult a doctor or dietitian before changing your diet.';
