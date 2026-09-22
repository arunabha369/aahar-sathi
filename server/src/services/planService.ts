import { cityFor } from '../data/cities.ts';
import { listMembers } from '../db/household.ts';
import { listMeals } from '../db/meals.ts';
import { insertActivePlan, type PlanRecord } from '../db/plans.ts';
import { findPreferences } from '../db/users.ts';
import { ApiError } from '../utils/ApiError.ts';
import { addDays, ekadashiDays, ramadanTimes, todayInIndia } from './almanac.ts';
import { householdShape, withHouseholdPortions } from './household.ts';
import { calculateTargets } from './nutrition.ts';
import { generatePlanDays, type FastTimes, type PlannerMeal } from './planGenerator.ts';
import {
  WEEKDAYS,
  type HouseholdMemberSnapshot,
  type PlanDay,
  type PlanInputs,
  type PlanPreferences,
  type Profile,
  type Targets,
  type Weekday,
} from '../types.ts';

/** Loads the meal database in the shape the generator wants. */
export async function loadPlannerMeals(): Promise<PlannerMeal[]> {
  const meals = await listMeals();
  if (meals.length === 0) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'The meal database is empty. Run `npm run seed` first.');
  }
  return meals;
}

/** The date each weekday of the coming plan week falls on, starting today (India time). */
export function planWeekDates(today = todayInIndia()): Record<Weekday, string> {
  const todayIndex = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  return Object.fromEntries(
    WEEKDAYS.map((weekday, index) => [weekday, addDays(today, (index - todayIndex + 7) % 7)]),
  ) as Record<Weekday, string>;
}

/** Weekdays of the coming plan week that are Ekadashi. */
export function ekadashiWeekdays(city: string | null, today = todayInIndia()): Weekday[] {
  const dates = planWeekDates(today);
  const fasts = new Set(ekadashiDays(today, 7, cityFor(city)).map((day) => day.date));
  return WEEKDAYS.filter((weekday) => fasts.has(dates[weekday]));
}

function ramadanWeek(city: string | null, today: string): Partial<Record<Weekday, FastTimes>> {
  const dates = planWeekDates(today);
  const place = cityFor(city);
  return Object.fromEntries(WEEKDAYS.map((weekday) => [weekday, ramadanTimes(dates[weekday], place)]));
}

/**
 * The preferences a plan is actually built with: on Ekadashi mode, this week's Ekadashi
 * days are added to the user's own weekly fast days.
 */
export function resolvePreferences(preferences: PlanPreferences, jain: boolean, today = todayInIndia()): PlanPreferences {
  const vratDays = new Set(preferences.vratDays);
  if (preferences.fasting === 'ekadashi') {
    for (const weekday of ekadashiWeekdays(preferences.city, today)) vratDays.add(weekday);
  }
  return {
    jain,
    fasting: preferences.fasting,
    vratDays: WEEKDAYS.filter((weekday) => vratDays.has(weekday)),
    city: preferences.city,
  };
}

export interface BuildPlanOptions {
  userId: string;
  profile: Profile;
  /** Settings to build with instead of the saved ones (editing an old plan). */
  preferences?: PlanPreferences;
  random?: () => number;
  /** For tests: the date the plan week starts. */
  today?: string;
}

export interface BuiltPlan {
  inputs: PlanInputs;
  targets: Targets;
  days: PlanDay[];
}

/** Works out a week of meals (for the household, if there is one) without saving it. */
export async function buildPlan({ userId, profile, preferences: override, random, today = todayInIndia() }: BuildPlanOptions): Promise<BuiltPlan> {
  const [meals, stored, members] = await Promise.all([loadPlannerMeals(), findPreferences(userId), listMembers(userId)]);
  const chosen = override ?? stored;
  const household = householdShape(profile, chosen, members);
  const preferences = resolvePreferences(chosen, household.jain, today);
  const targets = calculateTargets(profile, { calorieAdjustment: stored.calorieAdjustment });
  const planProfile: Profile = { ...profile, diet: household.diet };

  let days: PlanDay[];
  try {
    days = generatePlanDays({
      profile: planProfile,
      targets,
      meals,
      preferences,
      fastTimes: preferences.fasting === 'ramadan' ? ramadanWeek(preferences.city, today) : {},
      ...(random ? { random } : {}),
    });
  } catch (error) {
    // Only possible when the chosen modes leave a slot with no dish at all.
    throw ApiError.badRequest(
      error instanceof Error ? `${error.message} Try turning off one of your plan options.` : 'Could not build a plan.',
    );
  }
  days = withHouseholdPortions(days, targets.calories, household.members, new Map(meals.map((meal) => [meal.slug, meal])));

  const inputs: PlanInputs = {
    ...planProfile,
    preferences,
    chosenPreferences: { jain: chosen.jain, fasting: chosen.fasting, vratDays: chosen.vratDays, city: chosen.city },
    calorieAdjustment: stored.calorieAdjustment,
    ...(household.members.length > 0 ? { household: household.members } : {}),
  };
  return { inputs, targets, days };
}

/** Generates a fresh 7-day plan and makes it the active one. */
export async function createPlanForUser(options: BuildPlanOptions): Promise<PlanRecord> {
  const built = await buildPlan(options);
  return insertActivePlan({ userId: options.userId, ...built });
}

/** Re-applies a plan's household portions after its meals changed (swap, shuffle). */
export function refreshPortions(days: PlanDay[], inputs: PlanInputs, calories: number, meals: PlannerMeal[]): PlanDay[] {
  const members: HouseholdMemberSnapshot[] = inputs.household ?? [];
  return withHouseholdPortions(days, calories, members, new Map(meals.map((meal) => [meal.slug, meal])));
}

/** A shuffled plan keeps the sehri and iftar times it was made with. */
export function fastTimesOf(days: PlanDay[]): Partial<Record<Weekday, FastTimes>> {
  return Object.fromEntries(
    days.filter((day) => day.fastTimes).map((day) => [day.day, day.fastTimes!]),
  ) as Partial<Record<Weekday, FastTimes>>;
}
