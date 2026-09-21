import {
  PLAN_SLOTS,
  SLOT_META,
  WEEKDAYS,
  type Diet,
  type MealData,
  type MealItem,
  type MealSlot,
  type PlanDay,
  type PlanMeal,
  type PlanSlot,
  type Profile,
  type Targets,
} from '../types.ts';
import { pickOne } from '../utils/random.ts';

/** A meal ready to be planned: the meal data plus the database id we snapshot. */
export interface PlannerMeal extends MealData {
  id: string;
}

const FACTOR_STEP = 0.25;
const MIN_FACTOR = 0.5;
const MAX_FACTOR = 2.5;
/** How often the chosen cuisine wins when a matching dish is available. */
const CUISINE_PREFERENCE = 0.7;
/** A meal may appear at most this many times in the same slot in one week. */
const MAX_PER_SLOT_PER_WEEK = 2;
/** Pick at random from the few best-fitting dishes, so plans vary but still hit the target. */
const SHORTLIST_SIZE = 4;
/** Weight given to grams of protein per 100 kcal when ranking dishes. */
const PROTEIN_BONUS = 1.5;

export function mealSlotFor(slot: PlanSlot): MealSlot {
  return slot === 'midMorning' || slot === 'eveningSnack' ? 'snack' : slot;
}

export function dietAllows(userDiet: Diet, mealDiet: Diet): boolean {
  if (userDiet === 'nonveg') return true;
  if (userDiet === 'egg') return mealDiet !== 'nonveg';
  return mealDiet === 'veg';
}

export function slotTargetKcal(calories: number, slot: PlanSlot): number {
  return calories * SLOT_META[slot].share;
}

/** Scale to the slot's calorie share, in friendly quarter steps. */
export function scaleFactor(slotKcal: number, mealKcal: number): number {
  if (mealKcal <= 0) return 1;
  const raw = slotKcal / mealKcal;
  const stepped = Math.round(raw / FACTOR_STEP) * FACTOR_STEP;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, Number(stepped.toFixed(2))));
}

/** Quantities stay easy to cook: quarters for measures, whole numbers for eggs. */
export function scaleQuantity(item: MealItem, factor: number): number {
  const scaled = item.qty * factor;
  if (item.unit === 'egg') return Math.max(1, Math.round(scaled));
  if (item.unit === 'g' || item.unit === 'ml') return Math.max(5, Math.round(scaled / 5) * 5);
  const quartered = Math.round(scaled / 0.25) * 0.25;
  return Math.max(0.25, Number(quartered.toFixed(2)));
}

export function scaleMeal(meal: PlannerMeal, slot: PlanSlot, factor: number): PlanMeal {
  return {
    slot,
    time: SLOT_META[slot].time,
    mealId: meal.id,
    slug: meal.slug,
    name: meal.name,
    diet: meal.diet,
    region: meal.region,
    factor,
    items: meal.items.map((item) => ({ ...item, qty: scaleQuantity(item, factor) })),
    ingredients: meal.ingredients.map((ingredient) => ({ ...ingredient })),
    kcal: Math.round(meal.kcal * factor),
    protein: Math.round(meal.protein * factor),
    carbs: Math.round(meal.carbs * factor),
    fat: Math.round(meal.fat * factor),
  };
}

export function dayTotals(meals: PlanMeal[]): PlanDay['totals'] {
  return meals.reduce(
    (totals, meal) => ({
      kcal: totals.kcal + meal.kcal,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** How close a finished day has to sit to the calorie target before we stop nudging it. */
const DAY_TOLERANCE = 0.02;
const MAX_BALANCE_STEPS = 8;

interface ChosenMeal {
  meal: PlannerMeal;
  slot: PlanSlot;
  factor: number;
}

/**
 * Rounding each meal to a quarter portion can leave a day a little over or under
 * target. This nudges single portions by one quarter step until the day lands close.
 */
export function balanceDay(chosen: ChosenMeal[], targetKcal: number): ChosenMeal[] {
  let current = chosen.map((entry) => ({ ...entry }));

  for (let step = 0; step < MAX_BALANCE_STEPS; step += 1) {
    const total = current.reduce((sum, entry) => sum + entry.meal.kcal * entry.factor, 0);
    const error = Math.abs(total - targetKcal);
    if (error / targetKcal <= DAY_TOLERANCE) break;

    const direction = total < targetKcal ? FACTOR_STEP : -FACTOR_STEP;
    let best: { index: number; factor: number; error: number } | null = null;

    current.forEach((entry, index) => {
      const factor = Number((entry.factor + direction).toFixed(2));
      if (factor < MIN_FACTOR || factor > MAX_FACTOR) return;
      const candidateTotal = total + entry.meal.kcal * direction;
      const candidateError = Math.abs(candidateTotal - targetKcal);
      if (candidateError < error && (!best || candidateError < best.error)) {
        best = { index, factor, error: candidateError };
      }
    });

    if (!best) break;
    const winner: { index: number; factor: number; error: number } = best;
    current = current.map((entry, index) =>
      index === winner.index ? { ...entry, factor: winner.factor } : entry,
    );
  }

  return current;
}

type Requirement = 'egg' | 'meat' | null;

interface Relaxation {
  cuisine: boolean;
  weeklyLimit: boolean;
  consecutiveDays: boolean;
  sameDay: boolean;
}

/** Rules are dropped in this order when a slot cannot be filled. */
const RELAXATIONS: Relaxation[] = [
  { cuisine: true, weeklyLimit: true, consecutiveDays: true, sameDay: true },
  { cuisine: false, weeklyLimit: true, consecutiveDays: true, sameDay: true },
  { cuisine: false, weeklyLimit: false, consecutiveDays: true, sameDay: true },
  { cuisine: false, weeklyLimit: false, consecutiveDays: false, sameDay: true },
  { cuisine: false, weeklyLimit: false, consecutiveDays: false, sameDay: false },
];

interface PickContext {
  slot: PlanSlot;
  pool: PlannerMeal[];
  slotKcal: number;
  cuisine: Profile['cuisine'];
  preferCuisine: boolean;
  requirement: Requirement;
  weeklySlotUse: Map<string, number>;
  yesterdaySlugs: Set<string>;
  todaySlugs: Set<string>;
  excludeSlugs: Set<string>;
  random: () => number;
}

function meetsRequirement(meal: PlannerMeal, requirement: Requirement): boolean {
  if (requirement === 'egg') return meal.diet === 'egg';
  if (requirement === 'meat') return meal.diet === 'nonveg';
  return true;
}

function candidatesFor(context: PickContext, relaxation: Relaxation): PlannerMeal[] {
  return context.pool.filter((meal) => {
    if (context.excludeSlugs.has(meal.slug)) return false;
    if (!meetsRequirement(meal, context.requirement)) return false;
    if (relaxation.sameDay && context.todaySlugs.has(meal.slug)) return false;
    if (relaxation.consecutiveDays && context.yesterdaySlugs.has(meal.slug)) return false;
    if (relaxation.weeklyLimit && (context.weeklySlotUse.get(meal.slug) ?? 0) >= MAX_PER_SLOT_PER_WEEK) {
      return false;
    }
    if (
      relaxation.cuisine &&
      context.preferCuisine &&
      context.cuisine !== 'mix' &&
      meal.region !== context.cuisine
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Ranks dishes by how well they fit the slot's calorie share, with a nudge towards
 * protein-dense options, then picks at random from the best few so weeks stay varied.
 */
function shortlistScore(meal: PlannerMeal, slotKcal: number): number {
  const scaledKcal = meal.kcal * scaleFactor(slotKcal, meal.kcal);
  const calorieError = (Math.abs(scaledKcal - slotKcal) / slotKcal) * 100;
  const proteinDensity = (meal.protein / meal.kcal) * 100;
  return calorieError - PROTEIN_BONUS * proteinDensity;
}

function chooseFromShortlist(candidates: PlannerMeal[], slotKcal: number, random: () => number): PlannerMeal {
  const ranked = [...candidates].sort((a, b) => {
    const scoreA = shortlistScore(a, slotKcal);
    const scoreB = shortlistScore(b, slotKcal);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.slug.localeCompare(b.slug);
  });
  return pickOne(ranked.slice(0, Math.min(SHORTLIST_SIZE, ranked.length)), random);
}

export function pickMeal(context: PickContext): PlannerMeal | null {
  for (const relaxation of RELAXATIONS) {
    const candidates = candidatesFor(context, relaxation);
    if (candidates.length > 0) {
      return chooseFromShortlist(candidates, context.slotKcal, context.random);
    }
  }
  // Last resort: ignore the requirement too, rather than leave a slot empty.
  const fallback = context.pool.filter((meal) => !context.excludeSlugs.has(meal.slug));
  return fallback.length > 0 ? chooseFromShortlist(fallback, context.slotKcal, context.random) : null;
}

export interface GeneratePlanInput {
  profile: Profile;
  targets: Targets;
  meals: PlannerMeal[];
  random?: () => number;
}

function poolsByPlanSlot(meals: PlannerMeal[], diet: Diet): Record<PlanSlot, PlannerMeal[]> {
  const allowed = meals.filter((meal) => dietAllows(diet, meal.diet));
  return PLAN_SLOTS.reduce(
    (pools, slot) => {
      pools[slot] = allowed.filter((meal) => meal.slot === mealSlotFor(slot));
      return pools;
    },
    {} as Record<PlanSlot, PlannerMeal[]>,
  );
}

/** Which slot has to carry the day's egg or meat dish. */
function requirementPlan(diet: Diet, pools: Record<PlanSlot, PlannerMeal[]>, random: () => number): {
  slot: PlanSlot | null;
  requirement: Requirement;
} {
  if (diet === 'egg') {
    const options = PLAN_SLOTS.filter((slot) => pools[slot].some((meal) => meal.diet === 'egg'));
    return options.length > 0 ? { slot: pickOne(options, random), requirement: 'egg' } : { slot: null, requirement: null };
  }
  if (diet === 'nonveg') {
    const options = (['lunch', 'dinner'] as const).filter((slot) =>
      pools[slot].some((meal) => meal.diet === 'nonveg'),
    );
    return options.length > 0 ? { slot: pickOne(options, random), requirement: 'meat' } : { slot: null, requirement: null };
  }
  return { slot: null, requirement: null };
}

export function generatePlanDays({ profile, targets, meals, random = Math.random }: GeneratePlanInput): PlanDay[] {
  const pools = poolsByPlanSlot(meals, profile.diet);
  for (const slot of PLAN_SLOTS) {
    if (pools[slot].length === 0) {
      throw new Error(`No ${mealSlotFor(slot)} meals available for a ${profile.diet} diet.`);
    }
  }

  const weeklyUse: Record<PlanSlot, Map<string, number>> = PLAN_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = new Map<string, number>();
      return acc;
    },
    {} as Record<PlanSlot, Map<string, number>>,
  );

  const days: PlanDay[] = [];
  let yesterdaySlugs = new Set<string>();

  for (const weekday of WEEKDAYS) {
    const todaySlugs = new Set<string>();
    const { slot: requiredSlot, requirement } = requirementPlan(profile.diet, pools, random);
    const dayPicks: ChosenMeal[] = [];

    for (const slot of PLAN_SLOTS) {
      const slotKcal = slotTargetKcal(targets.calories, slot);
      const chosen = pickMeal({
        slot,
        pool: pools[slot],
        slotKcal,
        cuisine: profile.cuisine,
        preferCuisine: random() < CUISINE_PREFERENCE,
        requirement: slot === requiredSlot ? requirement : null,
        weeklySlotUse: weeklyUse[slot],
        yesterdaySlugs,
        todaySlugs,
        excludeSlugs: new Set<string>(),
        random,
      });

      if (!chosen) throw new Error(`Could not fill the ${slot} slot.`);

      todaySlugs.add(chosen.slug);
      weeklyUse[slot].set(chosen.slug, (weeklyUse[slot].get(chosen.slug) ?? 0) + 1);
      dayPicks.push({ meal: chosen, slot, factor: scaleFactor(slotKcal, chosen.kcal) });
    }

    const dayMeals = balanceDay(dayPicks, targets.calories).map((pick) =>
      scaleMeal(pick.meal, pick.slot, pick.factor),
    );

    days.push({ day: weekday, meals: dayMeals, totals: dayTotals(dayMeals) });
    yesterdaySlugs = todaySlugs;
  }

  return days;
}

export interface SwapMealInput {
  days: PlanDay[];
  dayIndex: number;
  slot: PlanSlot;
  profile: Profile;
  targets: Targets;
  meals: PlannerMeal[];
  random?: () => number;
}

/** Replaces one meal with a different dish that still fits the slot's calorie share. */
export function swapMealInDays({
  days,
  dayIndex,
  slot,
  profile,
  targets,
  meals,
  random = Math.random,
}: SwapMealInput): PlanDay[] {
  const day = days[dayIndex];
  if (!day) throw new Error(`Day ${dayIndex} is not part of this plan.`);

  const pools = poolsByPlanSlot(meals, profile.diet);
  const pool = pools[slot];
  const current = day.meals.find((meal) => meal.slot === slot);
  if (!current) throw new Error(`This plan has no ${slot} on ${day.day}.`);

  const weeklySlotUse = new Map<string, number>();
  days.forEach((otherDay, index) => {
    if (index === dayIndex) return;
    const meal = otherDay.meals.find((candidate) => candidate.slot === slot);
    if (meal) weeklySlotUse.set(meal.slug, (weeklySlotUse.get(meal.slug) ?? 0) + 1);
  });

  const neighbourSlugs = new Set<string>();
  for (const offset of [-1, 1]) {
    const neighbour = days[dayIndex + offset];
    neighbour?.meals.forEach((meal) => neighbourSlugs.add(meal.slug));
  }

  const todaySlugs = new Set(day.meals.filter((meal) => meal.slot !== slot).map((meal) => meal.slug));

  // Keep the day's egg/meat promise if this was the only dish carrying it.
  const dayHasEgg = day.meals.some((meal) => meal.slot !== slot && meal.diet === 'egg');
  const dayHasMeat = day.meals.some(
    (meal) => meal.slot !== slot && meal.diet === 'nonveg' && (meal.slot === 'lunch' || meal.slot === 'dinner'),
  );
  let requirement: Requirement = null;
  if (profile.diet === 'egg' && !dayHasEgg && pool.some((meal) => meal.diet === 'egg')) {
    requirement = 'egg';
  } else if (
    profile.diet === 'nonveg' &&
    !dayHasMeat &&
    (slot === 'lunch' || slot === 'dinner') &&
    pool.some((meal) => meal.diet === 'nonveg')
  ) {
    requirement = 'meat';
  }

  const slotKcal = slotTargetKcal(targets.calories, slot);
  const chosen = pickMeal({
    slot,
    pool,
    slotKcal,
    cuisine: profile.cuisine,
    preferCuisine: random() < CUISINE_PREFERENCE,
    requirement,
    weeklySlotUse,
    yesterdaySlugs: neighbourSlugs,
    todaySlugs,
    excludeSlugs: new Set([current.slug]),
    random,
  });

  if (!chosen) throw new Error('There is no other dish available for this slot.');

  const replacement = scaleMeal(chosen, slot, scaleFactor(slotKcal, chosen.kcal));
  const updatedMeals = day.meals.map((meal) => (meal.slot === slot ? replacement : meal));

  return days.map((existing, index) =>
    index === dayIndex ? { ...existing, meals: updatedMeals, totals: dayTotals(updatedMeals) } : existing,
  );
}
