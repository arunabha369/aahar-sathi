import {
  DEFAULT_PREFERENCES,
  PLAN_SLOTS,
  SLOT_META,
  WEEKDAYS,
  type DayKind,
  type Diet,
  type MealData,
  type MealItem,
  type MealSlot,
  type PlanDay,
  type PlanMeal,
  type PlanPreferences,
  type PlanSlot,
  type Profile,
  type Targets,
  type Weekday,
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
/** Repairs pick from this many of the best-scoring fixes. */
const REPAIR_SHORTLIST = 3;
/** Penalty per percentage point of a dish's calories from fat above the plan's fat share. */
const FAT_PENALTY = 1;

/** Things you count rather than measure: these must always come out as whole numbers. */
const COUNTABLE_UNITS = new Set([
  'adai',
  'appam',
  'chilla',
  'dosa',
  'egg',
  'glass',
  'idli',
  'paratha',
  'pav',
  'piece',
  'pieces',
  'roll',
  'roti',
  'slices',
  'thepla',
]);

export function isCountable(unit: string): boolean {
  return COUNTABLE_UNITS.has(unit);
}

const isWhole = (value: number) => Math.abs(value - Math.round(value)) < 1e-6;
const round4 = (value: number) => Math.round(value * 10_000) / 10_000;

export function mealSlotFor(slot: PlanSlot): MealSlot {
  return slot === 'midMorning' || slot === 'eveningSnack' ? 'snack' : slot;
}

export function dietAllows(userDiet: Diet, mealDiet: Diet): boolean {
  if (userDiet === 'nonveg') return true;
  if (userDiet === 'egg') return mealDiet !== 'nonveg';
  return mealDiet === 'veg';
}

/**
 * A Ramadan day is three meals: sehri before dawn (the breakfast slot), iftar at sunset
 * (the evening-snack slot) and dinner. Sehri is made large enough to carry the fast.
 */
export const RAMADAN_SLOTS = ['breakfast', 'eveningSnack', 'dinner'] as const satisfies readonly PlanSlot[];
/**
 * Above this many calories three meals would need portions past MAX_FACTOR, so the day
 * gets a fourth: a late snack after the evening prayers (it uses the mid-morning slot,
 * and is listed last, in eating order).
 */
export const RAMADAN_LATE_SNACK_FROM_KCAL = 2400;
/** Past this, even four dishes at their largest portions fall short, so the fourth becomes a full meal (a lunch dish). */
export const RAMADAN_LATE_MEAL_FROM_KCAL = 3200;

interface RamadanShape {
  slots: readonly PlanSlot[];
  shares: Partial<Record<PlanSlot, number>>;
}

const RAMADAN_SHAPES: { from: number; shape: RamadanShape }[] = [
  {
    from: RAMADAN_LATE_MEAL_FROM_KCAL,
    shape: {
      slots: ['breakfast', 'eveningSnack', 'dinner', 'lunch'],
      shares: { breakfast: 0.3, eveningSnack: 0.18, dinner: 0.3, lunch: 0.22 },
    },
  },
  {
    from: RAMADAN_LATE_SNACK_FROM_KCAL,
    shape: {
      slots: ['breakfast', 'eveningSnack', 'dinner', 'midMorning'],
      shares: { breakfast: 0.32, eveningSnack: 0.22, dinner: 0.34, midMorning: 0.12 },
    },
  },
  { from: 0, shape: { slots: RAMADAN_SLOTS, shares: { breakfast: 0.35, eveningSnack: 0.25, dinner: 0.4 } } },
];

/** Every slot a Ramadan day can use, whatever its size. */
const RAMADAN_ALL_SLOTS: readonly PlanSlot[] = ['breakfast', 'eveningSnack', 'dinner', 'midMorning', 'lunch'];

const ramadanShape = (calories: number): RamadanShape =>
  RAMADAN_SHAPES.find((candidate) => calories >= candidate.from)!.shape;

export const RAMADAN_LABELS: Partial<Record<PlanSlot, string>> = {
  breakfast: 'Sehri',
  eveningSnack: 'Iftar',
  dinner: 'Dinner',
  midMorning: 'Late snack',
  lunch: 'Late meal',
};
/** Used when no city is set, so there are no calculated times to go by. */
const RAMADAN_DEFAULT_TIMES: Partial<Record<PlanSlot, string>> = {
  breakfast: '4:30 AM',
  eveningSnack: '6:30 PM',
  dinner: '8:30 PM',
  midMorning: '10:30 PM',
  lunch: '10:30 PM',
};

export function slotsFor(kind: DayKind, calories = 0): readonly PlanSlot[] {
  return kind === 'ramadan' ? ramadanShape(calories).slots : PLAN_SLOTS;
}

export function slotShare(slot: PlanSlot, kind: DayKind = 'normal', calories = 0): number {
  return kind === 'ramadan' ? (ramadanShape(calories).shares[slot] ?? 0) : SLOT_META[slot].share;
}

export function slotTargetKcal(calories: number, slot: PlanSlot, kind: DayKind = 'normal'): number {
  return calories * slotShare(slot, kind, calories);
}

/**
 * Which kind of day each weekday is. Navratri and Ramadan cover the whole week; otherwise
 * the fast days are the user's weekly vrat days (plus, in Ekadashi mode, that week's
 * Ekadashi, which the plan service adds before generating).
 */
export function dayKindFor(weekday: Weekday, preferences: PlanPreferences): DayKind {
  if (preferences.fasting === 'navratri') return 'vrat';
  if (preferences.fasting === 'ramadan') return 'ramadan';
  return preferences.vratDays.includes(weekday) ? 'vrat' : 'normal';
}

/**
 * Vrat staples (paneer, curd, peanuts, ghee) put even lean fast-day dishes at 30–40% of
 * calories from fat, so fast days are balanced against the top of the healthy 20–35% range
 * instead of the everyday 25%.
 */
export const VRAT_FAT_SHARE = 0.35;

export function dayTargetsFor(targets: DayTargets, kind: DayKind): DayTargets {
  if (kind !== 'vrat') return targets;
  return { ...targets, fat: Math.max(targets.fat, Math.round((targets.calories * VRAT_FAT_SHARE) / 9)) };
}

/** Vrat and Jain food is always vegetarian, whatever the profile says. */
export function effectiveDiet(diet: Diet, kind: DayKind, preferences: Pick<PlanPreferences, 'jain'>): Diet {
  return kind === 'vrat' || preferences.jain ? 'veg' : diet;
}

const hasTag = (meal: MealData, tag: NonNullable<MealData['tags']>[number]) => meal.tags?.includes(tag) ?? false;

/** Whether a dish belongs in a given slot on a given kind of day. */
export function fitsDay(meal: MealData, slot: PlanSlot, kind: DayKind, jain: boolean): boolean {
  if (meal.slot !== mealSlotFor(slot)) return false;
  if (jain && !hasTag(meal, 'jain')) return false;
  if (kind === 'vrat') return hasTag(meal, 'vrat');
  if (kind === 'ramadan') {
    if (slot === 'breakfast') return hasTag(meal, 'sehri');
    if (slot === 'eveningSnack') return hasTag(meal, 'iftar');
  }
  // Fast-day staples and iftar platters stay out of ordinary slots.
  return !hasTag(meal, 'fastOnly') && !hasTag(meal, 'iftar');
}

const QUARTER_FACTORS: number[] = Array.from(
  { length: Math.round((MAX_FACTOR - MIN_FACTOR) / FACTOR_STEP) + 1 },
  (_, index) => round4(MIN_FACTOR + index * FACTOR_STEP),
);

const factorCache = new Map<string, number[]>();

/**
 * The portion sizes a dish can be served at. Measured dishes (bowls, cups, grams) scale in
 * quarter steps; a dish with anything you count only takes factors that keep every count
 * whole — 3 idlis can become 2, 4 or 5 idlis, never 3¾.
 */
export function portionFactors(meal: Pick<MealData, 'items'> & { slug?: string }): number[] {
  const cached = meal.slug ? factorCache.get(meal.slug) : undefined;
  if (cached) return cached;

  const counts = meal.items.filter((item) => isCountable(item.unit)).map((item) => item.qty);
  let factors = QUARTER_FACTORS;
  if (counts.length > 0) {
    const whole = new Set<number>();
    for (const count of counts) {
      for (let n = Math.ceil(MIN_FACTOR * count - 1e-9); n <= Math.floor(MAX_FACTOR * count + 1e-9); n += 1) {
        const factor = n / count;
        if (counts.every((other) => isWhole(other * factor))) whole.add(round4(factor));
      }
    }
    // The dish as written is always servable.
    whole.add(1);
    factors = [...whole].sort((a, b) => a - b);
  }

  if (meal.slug) factorCache.set(meal.slug, factors);
  return factors;
}

/** The allowed factor closest to what the slot's calorie share asks for. */
export function scaleFactor(slotKcal: number, mealKcal: number, factors: number[] = QUARTER_FACTORS): number {
  if (mealKcal <= 0) return 1;
  const wanted = slotKcal / mealKcal;
  return factors.reduce((best, factor) => (Math.abs(factor - wanted) < Math.abs(best - wanted) - 1e-9 ? factor : best));
}

/** Quantities stay easy to cook: whole numbers for anything counted, quarters for measures, 5 g/ml steps. */
export function scaleQuantity(item: MealItem, factor: number): number {
  const scaled = item.qty * factor;
  if (isCountable(item.unit)) return Math.max(1, Math.round(scaled));
  if (item.unit === 'g' || item.unit === 'ml') return Math.max(5, Math.round(scaled / 5) * 5);
  const quartered = Math.round(scaled / 0.25) * 0.25;
  return Math.max(0.25, Number(quartered.toFixed(2)));
}

export interface SlotDisplay {
  time: string;
  label?: string;
}

/** The time and name a slot shows on a given kind of day. */
export function slotDisplay(slot: PlanSlot, kind: DayKind = 'normal', times?: Partial<Record<PlanSlot, string>>): SlotDisplay {
  if (kind !== 'ramadan') return { time: SLOT_META[slot].time };
  return {
    time: times?.[slot] ?? RAMADAN_DEFAULT_TIMES[slot] ?? SLOT_META[slot].time,
    ...(RAMADAN_LABELS[slot] ? { label: RAMADAN_LABELS[slot] } : {}),
  };
}

export function scaleMeal(meal: PlannerMeal, slot: PlanSlot, factor: number, display?: SlotDisplay): PlanMeal {
  const { time, label } = display ?? slotDisplay(slot);
  return {
    slot,
    time,
    ...(label ? { label } : {}),
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

const MAX_BALANCE_STEPS = 12;
/** A day inside these bounds is left as picked; outside them, dishes get swapped for better fits. */
const COMFORT = { kcal: 0.03, fatOver: 1.1, proteinUnder: 0.9 } as const;
/** Dishes a repaired day may take from outside the user's chosen cuisine. */
const MAX_BORROWED = 2;
/** The dashboard's own "High" fat and "Low" protein flags. */
const FLAGGED = { fatOver: 1.15, proteinUnder: 0.85 } as const;

interface ChosenMeal {
  meal: PlannerMeal;
  slot: PlanSlot;
  factor: number;
}

type DayTargets = Pick<Targets, 'calories' | 'protein' | 'fat'>;

/** Anything with per-portion macros and a portion factor: a pick, or a meal already in a plan (factor 1). */
interface Portioned {
  meal: Pick<MealData, 'kcal' | 'protein' | 'fat'>;
  factor: number;
}

function chosenTotals(chosen: Portioned[]): { kcal: number; protein: number; fat: number } {
  return chosen.reduce(
    (totals, entry) => ({
      kcal: totals.kcal + entry.meal.kcal * entry.factor,
      protein: totals.protein + entry.meal.protein * entry.factor,
      fat: totals.fat + entry.meal.fat * entry.factor,
    }),
    { kcal: 0, protein: 0, fat: 0 },
  );
}

/**
 * How far a day is from its targets — lower is better. Calories count most (the plan's
 * promise); fat above target and protein below it are what the dashboard flags.
 */
export function dayScore(chosen: Portioned[], targets: DayTargets): number {
  const totals = chosenTotals(chosen);
  const kcalError = Math.abs(totals.kcal - targets.calories) / targets.calories;
  const fatOver = Math.max(0, totals.fat / targets.fat - 1);
  const proteinShort = Math.max(0, 1 - totals.protein / targets.protein);
  // Protein counts double: the dashboard's "Low" flag is the harder one to fix, and
  // weighting it more than 2× starts letting fat creep back over target.
  return kcalError * 3 + fatOver + 2 * proteinShort;
}

/** Would the dashboard show this day with a "High" fat or "Low" protein flag? */
function isFlagged(chosen: Portioned[], targets: DayTargets): boolean {
  const totals = chosenTotals(chosen);
  return totals.fat > targets.fat * FLAGGED.fatOver || totals.protein < targets.protein * FLAGGED.proteinUnder;
}

function isComfortable(chosen: Portioned[], targets: DayTargets): boolean {
  const totals = chosenTotals(chosen);
  return (
    Math.abs(totals.kcal - targets.calories) / targets.calories <= COMFORT.kcal &&
    totals.fat <= targets.fat * COMFORT.fatOver &&
    totals.protein >= targets.protein * COMFORT.proteinUnder
  );
}

/**
 * Nudges portions one allowed step at a time — trimming a rich snack, adding to a lean dal —
 * whichever move improves the day most, until nothing helps.
 */
export function balanceDay(chosen: ChosenMeal[], targets: DayTargets): ChosenMeal[] {
  let current = chosen.map((entry) => ({ ...entry }));
  let score = dayScore(current, targets);

  for (let step = 0; step < MAX_BALANCE_STEPS; step += 1) {
    let best: { chosen: ChosenMeal[]; score: number } | null = null;

    current.forEach((entry, index) => {
      const factors = portionFactors(entry.meal);
      const position = factors.findIndex((factor) => Math.abs(factor - entry.factor) < 1e-9);
      for (const neighbour of [factors[position - 1], factors[position + 1]]) {
        if (neighbour === undefined) continue;
        const trial = current.map((other, otherIndex) => (otherIndex === index ? { ...other, factor: neighbour } : other));
        const trialScore = dayScore(trial, targets);
        if (trialScore < score - 1e-9 && (!best || trialScore < best.score)) best = { chosen: trial, score: trialScore };
      }
    });

    if (!best) break;
    const winner: { chosen: ChosenMeal[]; score: number } = best;
    current = winner.chosen;
    score = winner.score;
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
  /** Share of the day's calories meant to come from fat (the plan's target). */
  fatShare: number;
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
 * Ranks dishes by how well they fit the slot's calorie share (at a portion they can really
 * be served at), with a nudge towards protein-dense and away from fat-heavy options, then
 * picks at random from the best few so weeks stay varied.
 */
function shortlistScore(meal: PlannerMeal, slotKcal: number, fatShare: number): number {
  const scaledKcal = meal.kcal * scaleFactor(slotKcal, meal.kcal, portionFactors(meal));
  const calorieError = (Math.abs(scaledKcal - slotKcal) / slotKcal) * 100;
  const proteinDensity = (meal.protein / meal.kcal) * 100;
  const fatExcess = Math.max(0, (meal.fat * 9) / meal.kcal - fatShare) * 100;
  return calorieError - PROTEIN_BONUS * proteinDensity + FAT_PENALTY * fatExcess;
}

function chooseFromShortlist(
  candidates: PlannerMeal[],
  slotKcal: number,
  fatShare: number,
  random: () => number,
): PlannerMeal {
  const ranked = [...candidates].sort((a, b) => {
    const scoreA = shortlistScore(a, slotKcal, fatShare);
    const scoreB = shortlistScore(b, slotKcal, fatShare);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.slug.localeCompare(b.slug);
  });
  return pickOne(ranked.slice(0, Math.min(SHORTLIST_SIZE, ranked.length)), random);
}

/** The dishes a slot may take under the strictest rules that still leave a choice. */
function eligibleMeals(context: PickContext): PlannerMeal[] {
  for (const relaxation of RELAXATIONS) {
    const candidates = candidatesFor(context, relaxation);
    if (candidates.length > 0) return candidates;
  }
  // Last resort: ignore the requirement too, rather than leave a slot empty.
  return context.pool.filter((meal) => !context.excludeSlugs.has(meal.slug));
}

export function pickMeal(context: PickContext): PlannerMeal | null {
  const candidates = eligibleMeals(context);
  return candidates.length > 0
    ? chooseFromShortlist(candidates, context.slotKcal, context.fatShare, context.random)
    : null;
}

/**
 * A day that picked dishes cannot balance (too much fat, too little protein) gets one dish
 * at a time replaced by the eligible alternative that fixes it most, under the same rules.
 */
/** The diet's daily promise: an egg dish anywhere, or meat at lunch or dinner. */
interface DayRequirement {
  requirement: Requirement;
  slots: readonly PlanSlot[];
}

function satisfies(entries: ChosenMeal[], { requirement, slots }: DayRequirement): boolean {
  if (!requirement) return true;
  return entries.some((entry) => slots.includes(entry.slot) && meetsRequirement(entry.meal, requirement));
}

function improveDay(
  chosen: ChosenMeal[],
  contexts: PickContext[],
  targets: DayTargets,
  dayRequirement: DayRequirement,
): ChosenMeal[] {
  let current = balanceDay(chosen, targets);
  let borrowed = 0;

  for (let pass = 0; pass < 2 && !isComfortable(current, targets); pass += 1) {
    let changed = false;

    for (let index = 0; index < current.length; index += 1) {
      if (isComfortable(current, targets)) break;
      const context = contexts[index]!;
      const entry = current[index]!;
      const rest = current.filter((_, other) => other !== index);
      const otherSlugs = new Set(rest.map((other) => other.meal.slug));
      // The promise is per day, not per slot: if another meal already keeps it, this slot is free.
      const requirement = satisfies(rest, dayRequirement)
        ? null
        : dayRequirement.slots.includes(entry.slot)
          ? dayRequirement.requirement
          : context.requirement;

      // Alternatives come from the same rule level that admits the current dish, and only
      // then is the current dish dropped — so a replacement is never allowed to break a rule
      // (a repeat from yesterday, say) that the original pick respected. Cuisine is left open
      // here because it is a preference, not a rule; it is handled just below.
      const alternatives = eligibleMeals({
        ...context,
        requirement,
        preferCuisine: false,
        todaySlugs: otherSlugs,
        excludeSlugs: new Set(),
      }).filter((meal) => meal.slug !== entry.meal.slug);

      const currentScore = dayScore(current, targets);
      const improvementsFrom = (meals: PlannerMeal[]) =>
        meals.flatMap((meal) => {
          const trial = balanceDay(
            current.map((other, otherIndex) =>
              otherIndex === index
                ? { meal, slot: other.slot, factor: scaleFactor(context.slotKcal, meal.kcal, portionFactors(meal)) }
                : other,
            ),
            targets,
          );
          const score = dayScore(trial, targets);
          return score < currentScore - 0.005 ? [{ chosen: trial, score }] : [];
        });
      const ownCuisine = (meal: PlannerMeal) => context.cuisine === 'mix' || meal.region === context.cuisine;

      // Dishes from the user's own cuisine get the first chance to fix the day. Another
      // region's dish is borrowed only when the day would otherwise show a "High" or "Low"
      // flag, and at most MAX_BORROWED times a day, so the chosen cuisine still leads the week.
      let improvements = improvementsFrom(alternatives.filter(ownCuisine));
      let borrowing = false;
      if (improvements.length === 0 && borrowed < MAX_BORROWED && isFlagged(current, targets)) {
        improvements = improvementsFrom(alternatives.filter((meal) => !ownCuisine(meal)));
        borrowing = true;
      }

      if (improvements.length > 0) {
        // One of the few best fixes, not always the single best, so repaired days don't all
        // converge on the same handful of lean dishes.
        improvements.sort((a, b) => a.score - b.score);
        current = pickOne(improvements.slice(0, REPAIR_SHORTLIST), context.random).chosen;
        changed = true;
        if (borrowing) borrowed += 1;
      }
    }

    if (!changed) break;
  }

  return current;
}

/** Ramadan days: the calculated sehri and iftar times for the date each weekday falls on. */
export type FastTimes = NonNullable<PlanDay['fastTimes']>;

export interface GeneratePlanInput {
  profile: Profile;
  targets: Targets;
  meals: PlannerMeal[];
  preferences?: PlanPreferences;
  fastTimes?: Partial<Record<Weekday, FastTimes>>;
  random?: () => number;
}

type Pools = Partial<Record<PlanSlot, PlannerMeal[]>>;

function poolsFor(meals: PlannerMeal[], diet: Diet, kind: DayKind, preferences: PlanPreferences): Pools {
  const allowedDiet = effectiveDiet(diet, kind, preferences);
  const allowed = meals.filter((meal) => dietAllows(allowedDiet, meal.diet));
  const pools: Pools = {};
  for (const slot of kind === 'ramadan' ? RAMADAN_ALL_SLOTS : PLAN_SLOTS) {
    pools[slot] = allowed.filter((meal) => fitsDay(meal, slot, kind, preferences.jain));
  }
  return pools;
}

const KIND_NAMES: Record<DayKind, string> = { normal: '', vrat: 'vrat ', ramadan: 'Ramadan ' };

function checkPools(pools: Pools, kind: DayKind, diet: Diet, calories: number): void {
  for (const slot of slotsFor(kind, calories)) {
    if ((pools[slot] ?? []).length === 0) {
      throw new Error(`No ${KIND_NAMES[kind]}${mealSlotFor(slot)} meals available for a ${diet} diet.`);
    }
  }
}

/** Which slot has to carry the day's egg or meat dish. */
function requirementPlan(
  diet: Diet,
  pools: Pools,
  slots: readonly PlanSlot[],
  random: () => number,
): { slot: PlanSlot | null; requirement: Requirement } {
  if (diet === 'egg') {
    const options = slots.filter((slot) => (pools[slot] ?? []).some((meal) => meal.diet === 'egg'));
    return options.length > 0 ? { slot: pickOne(options, random), requirement: 'egg' } : { slot: null, requirement: null };
  }
  if (diet === 'nonveg') {
    const options = slots.filter(
      (slot) => (slot === 'lunch' || slot === 'dinner') && (pools[slot] ?? []).some((meal) => meal.diet === 'nonveg'),
    );
    return options.length > 0 ? { slot: pickOne(options, random), requirement: 'meat' } : { slot: null, requirement: null };
  }
  return { slot: null, requirement: null };
}

/** Clock times ("4:52 AM") for a Ramadan day's slots, from the calculated sehri and iftar. */
export function ramadanMealTimes(times: FastTimes | undefined): Partial<Record<PlanSlot, string>> | undefined {
  if (!times) return undefined;
  const toMinutes = (hhmm: string) => {
    const [hours, minutes] = hhmm.split(':').map(Number);
    return hours! * 60 + minutes!;
  };
  // Rounded to 5 minutes, but never the unsafe way: sehri earlier, iftar later.
  const clock = (total: number, round: (value: number) => number = Math.round) => {
    const minutes = ((round(total / 5) * 5) % 1440 + 1440) % 1440;
    const hours = Math.floor(minutes / 60);
    const suffix = hours < 12 ? 'AM' : 'PM';
    return `${hours % 12 === 0 ? 12 : hours % 12}:${String(minutes % 60).padStart(2, '0')} ${suffix}`;
  };

  const sehriEnds = toMinutes(times.sehriEnds);
  const iftar = toMinutes(times.iftar);
  return {
    // Eat sehri in good time before it ends; dinner comes after the evening prayers.
    breakfast: clock(sehriEnds - 40, Math.floor),
    eveningSnack: clock(iftar, Math.ceil),
    dinner: clock(iftar + 120),
    midMorning: clock(iftar + 240),
    lunch: clock(iftar + 240),
  };
}

export function generatePlanDays({
  profile,
  targets,
  meals,
  preferences = DEFAULT_PREFERENCES,
  fastTimes = {},
  random = Math.random,
}: GeneratePlanInput): PlanDay[] {
  const poolsByKind = new Map<DayKind, Pools>();
  const poolsOf = (kind: DayKind): Pools => {
    let pools = poolsByKind.get(kind);
    if (!pools) {
      pools = poolsFor(meals, profile.diet, kind, preferences);
      checkPools(pools, kind, effectiveDiet(profile.diet, kind, preferences), targets.calories);
      poolsByKind.set(kind, pools);
    }
    return pools;
  };
  // Fail before building anything if a day of the week could not be filled.
  for (const weekday of WEEKDAYS) poolsOf(dayKindFor(weekday, preferences));

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
    const kind = dayKindFor(weekday, preferences);
    const dayTargets = dayTargetsFor(targets, kind);
    const fatShare = (dayTargets.fat * 9) / targets.calories;
    const pools = poolsOf(kind);
    const slots = slotsFor(kind, targets.calories);
    const diet = effectiveDiet(profile.diet, kind, preferences);
    const todaySlugs = new Set<string>();
    const { slot: requiredSlot, requirement } = requirementPlan(diet, pools, slots, random);
    const dayPicks: ChosenMeal[] = [];
    const contexts: PickContext[] = [];

    for (const slot of slots) {
      const slotKcal = slotTargetKcal(targets.calories, slot, kind);
      const context: PickContext = {
        slot,
        pool: pools[slot] ?? [],
        slotKcal,
        cuisine: profile.cuisine,
        preferCuisine: random() < CUISINE_PREFERENCE,
        requirement: slot === requiredSlot ? requirement : null,
        weeklySlotUse: weeklyUse[slot],
        yesterdaySlugs,
        todaySlugs,
        excludeSlugs: new Set<string>(),
        fatShare,
        random,
      };
      const chosen = pickMeal(context);
      if (!chosen) throw new Error(`Could not fill the ${slot} slot.`);

      todaySlugs.add(chosen.slug);
      contexts.push(context);
      dayPicks.push({ meal: chosen, slot, factor: scaleFactor(slotKcal, chosen.kcal, portionFactors(chosen)) });
    }

    const dayRequirement: DayRequirement = {
      requirement,
      slots: requirement === 'meat' ? slots.filter((slot) => slot === 'lunch' || slot === 'dinner') : slots,
    };
    const finalPicks = improveDay(dayPicks, contexts, dayTargets, dayRequirement);
    for (const pick of finalPicks) {
      weeklyUse[pick.slot].set(pick.meal.slug, (weeklyUse[pick.slot].get(pick.meal.slug) ?? 0) + 1);
    }

    const times = kind === 'ramadan' ? fastTimes[weekday] : undefined;
    const clock = ramadanMealTimes(times);
    const dayMeals = finalPicks.map((pick) =>
      scaleMeal(pick.meal, pick.slot, pick.factor, slotDisplay(pick.slot, kind, clock)),
    );
    days.push({
      day: weekday,
      meals: dayMeals,
      totals: dayTotals(dayMeals),
      ...(kind !== 'normal' ? { kind } : {}),
      ...(times ? { fastTimes: times } : {}),
    });
    yesterdaySlugs = new Set(finalPicks.map((pick) => pick.meal.slug));
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
  preferences?: PlanPreferences;
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
  preferences = DEFAULT_PREFERENCES,
  random = Math.random,
}: SwapMealInput): PlanDay[] {
  const day = days[dayIndex];
  if (!day) throw new Error(`Day ${dayIndex} is not part of this plan.`);

  const kind: DayKind = day.kind ?? 'normal';
  const diet = effectiveDiet(profile.diet, kind, preferences);
  const pool = poolsFor(meals, profile.diet, kind, preferences)[slot] ?? [];
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
  if (diet === 'egg' && !dayHasEgg && pool.some((meal) => meal.diet === 'egg')) {
    requirement = 'egg';
  } else if (
    diet === 'nonveg' &&
    !dayHasMeat &&
    (slot === 'lunch' || slot === 'dinner') &&
    pool.some((meal) => meal.diet === 'nonveg')
  ) {
    requirement = 'meat';
  }

  const slotKcal = slotTargetKcal(targets.calories, slot, kind);
  const dayTargets = dayTargetsFor(targets, kind);
  const candidates = eligibleMeals({
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
    fatShare: (dayTargets.fat * 9) / targets.calories,
    random,
  });
  if (candidates.length === 0) throw new Error('There is no other dish available for this slot.');

  // The other meals keep their portions; each candidate is tried at every size it can be
  // served at, and one of the few that leave the day best balanced is picked.
  const others: Portioned[] = day.meals.filter((meal) => meal.slot !== slot).map((meal) => ({ meal, factor: 1 }));
  const ranked = candidates
    .map((meal) => {
      const best = portionFactors(meal)
        .map((factor) => ({ factor, score: dayScore([...others, { meal, factor }], dayTargets) }))
        .reduce((a, b) => (b.score < a.score - 1e-9 ? b : a));
      return { meal, ...best };
    })
    .sort((a, b) => a.score - b.score || a.meal.slug.localeCompare(b.meal.slug));
  const chosen = pickOne(ranked.slice(0, Math.min(SHORTLIST_SIZE, ranked.length)), random);

  // The slot keeps its time and name (a Ramadan iftar stays at sunset).
  const replacement = scaleMeal(chosen.meal, slot, chosen.factor, {
    time: current.time,
    ...(current.label ? { label: current.label } : {}),
  });
  const updatedMeals = day.meals.map((meal) => (meal.slot === slot ? replacement : meal));

  return days.map((existing, index) =>
    index === dayIndex ? { ...existing, meals: updatedMeals, totals: dayTotals(updatedMeals) } : existing,
  );
}
