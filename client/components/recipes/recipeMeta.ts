import type { MealSlot, MealTag, PlanSlot } from '@/lib/types';

/** Tags worth showing a reader; `fastOnly` is internal to the planner. */
export const TAG_LABELS: Partial<Record<MealTag, string>> = {
  vrat: 'Vrat',
  jain: 'Jain-friendly',
  sehri: 'Sehri',
  iftar: 'Iftar',
};

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

/** The plan slot whose icon stands in for a dish without a photo. */
export const ICON_SLOT: Record<MealSlot, PlanSlot> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'eveningSnack',
};

export const REGION_LABELS: Record<string, string> = {
  north: 'North Indian',
  south: 'South Indian',
  east: 'Eastern',
  west: 'Western',
  pan: 'All over India',
};
