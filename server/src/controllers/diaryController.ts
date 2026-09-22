import type { Request, Response } from 'express';
import * as diary from '../db/diary.ts';
import { pool } from '../db/pool.ts';
import { findActivePlan } from '../db/plans.ts';
import { findPreferences, findUserById } from '../db/users.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import { validBody, validParams, validQuery } from '../middleware/validate.ts';
import { calculateTargets } from '../services/nutrition.ts';
import { onDate } from '../services/fastTimes.ts';
import { lookupBarcode } from '../services/openFoodFacts.ts';
import { ApiError } from '../utils/ApiError.ts';
import { addDays, toDateKey } from '../utils/date.ts';
import { PLAN_SLOTS, WEEKDAYS, type PlanDay, type Profile, type Targets } from '../types.ts';
import type {
  BarcodeParams,
  CheckinBody,
  CheckinParams,
  CustomFoodBody,
  DateParams,
  EntryBody,
  EntryParams,
  FoodSearchQuery,
  SummaryQuery,
} from '../validation/schemas.ts';

const DAYS_BACK = 365;
/** Within this share of the calorie target counts as "on target" for a fully tracked day. */
const ON_TARGET = 0.1;

const round = (value: number) => Math.round(value);
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Mon…Sun for a 'YYYY-MM-DD' date — the plan day it belongs to. */
function weekdayOf(date: string): (typeof WEEKDAYS)[number] {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return WEEKDAYS[(day + 6) % 7]!;
}

/** Diary dates: nothing further ahead than a timezone can be, and nothing absurdly old. */
function assertDiaryDate(date: string): void {
  const today = toDateKey(new Date());
  if (date > toDateKey(addDays(new Date(`${today}T00:00:00`), 1))) {
    throw ApiError.badRequest('You can’t log food for a day that hasn’t happened yet.');
  }
  if (date < toDateKey(addDays(new Date(`${today}T00:00:00`), -DAYS_BACK))) {
    throw ApiError.badRequest('That day is too far back to change.');
  }
}

async function targetsFor(userId: string): Promise<{ targets: Targets | null; planDay: (date: string) => PlanDay | null }> {
  const plan = await findActivePlan(userId);
  if (plan) {
    return {
      targets: plan.targets,
      planDay: (date) => {
        const day = plan.days.find((candidate) => candidate.day === weekdayOf(date));
        return day ? onDate(day, date, plan.inputs) : null;
      },
    };
  }
  const [user, preferences] = await Promise.all([findUserById(userId), findPreferences(userId)]);
  return {
    targets: user?.profileComplete
      ? calculateTargets(user.profile as Profile, { calorieAdjustment: preferences.calorieAdjustment })
      : null,
    planDay: () => null,
  };
}

function sumMacros(items: diary.Macros[]): diary.Macros {
  const total = items.reduce(
    (sum, item) => ({
      kcal: sum.kcal + item.kcal,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return { kcal: round(total.kcal), protein: round(total.protein), carbs: round(total.carbs), fat: round(total.fat) };
}

async function buildDay(userId: string, date: string) {
  const [{ targets, planDay }, checkins, entries] = await Promise.all([
    targetsFor(userId),
    diary.listCheckins(userId, date),
    diary.listEntries(userId, date),
  ]);
  const day = planDay(date);
  const bySlot = new Map(checkins.map((checkin) => [checkin.slot, checkin]));

  const planned = (day?.meals ?? []).map((meal) => ({
    slot: meal.slot,
    time: meal.time,
    ...(meal.label ? { label: meal.label } : {}),
    slug: meal.slug,
    name: meal.name,
    items: meal.items,
    kcal: meal.kcal,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    status: bySlot.get(meal.slot)?.status ?? null,
  }));

  const eaten = sumMacros([...checkins.filter((checkin) => checkin.status === 'eaten'), ...entries]);
  return {
    date,
    weekday: weekdayOf(date),
    kind: day?.kind ?? 'normal',
    ...(day?.fastTimes ? { fastTimes: day.fastTimes } : {}),
    planned,
    checkins,
    entries,
    eaten,
    targets,
  };
}

export async function getDay(req: Request, res: Response): Promise<void> {
  const { date } = validParams<DateParams>(req);
  res.json(await buildDay(currentUserId(req), date));
}

/** Marks a planned meal as eaten or skipped, saving the planned meal's numbers with it. */
export async function setCheckin(req: Request, res: Response): Promise<void> {
  const { date, slot } = validParams<CheckinParams>(req);
  const { status } = validBody<CheckinBody>(req);
  assertDiaryDate(date);
  const userId = currentUserId(req);

  const { planDay } = await targetsFor(userId);
  const meal = planDay(date)?.meals.find((candidate) => candidate.slot === slot);
  if (!meal) throw ApiError.badRequest('There is no planned meal to check in for then. Generate a plan first.');

  await diary.upsertCheckin(userId, date, {
    slot,
    status,
    mealName: meal.name,
    kcal: meal.kcal,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
  });
  res.json(await buildDay(userId, date));
}

export async function clearCheckin(req: Request, res: Response): Promise<void> {
  const { date, slot } = validParams<CheckinParams>(req);
  assertDiaryDate(date);
  await diary.deleteCheckin(currentUserId(req), date, slot);
  res.json(await buildDay(currentUserId(req), date));
}

/**
 * Logs a food. With a slot it replaced that planned meal, so the meal is checked in as
 * "swapped" (its snapshot kept for the record, but not counted as eaten).
 */
export async function addEntry(req: Request, res: Response): Promise<void> {
  const { date } = validParams<DateParams>(req);
  const body = validBody<EntryBody>(req);
  assertDiaryDate(date);
  const userId = currentUserId(req);
  const slot = body.slot ?? null;

  let base: diary.Macros & { name: string; servingLabel: string };
  if (body.source === 'meal') {
    const meal = await diary.findMealBySlug(body.ref);
    if (!meal) throw ApiError.badRequest('That dish is not on the menu any more.');
    base = { ...meal, servingLabel: 'serving' };
  } else if (body.source === 'custom') {
    const food = await diary.findCustomFood(userId, body.ref);
    if (!food) throw ApiError.badRequest('That food is not in your list any more.');
    base = food;
  } else {
    base = { name: body.name, servingLabel: body.servingLabel, kcal: body.kcal, protein: body.protein, carbs: body.carbs, fat: body.fat };
  }

  if (slot) {
    const { planDay } = await targetsFor(userId);
    const meal = planDay(date)?.meals.find((candidate) => candidate.slot === slot);
    if (!meal) throw ApiError.badRequest('There is no planned meal at that time to replace.');
    await diary.upsertCheckin(userId, date, {
      slot,
      status: 'swapped',
      mealName: meal.name,
      kcal: meal.kcal,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    });
  }

  await diary.insertEntry(userId, date, {
    slot,
    source: body.source,
    ref: body.ref,
    name: base.name,
    servingLabel: base.servingLabel,
    servings: body.servings,
    kcal: round(base.kcal * body.servings),
    protein: round1(base.protein * body.servings),
    carbs: round1(base.carbs * body.servings),
    fat: round1(base.fat * body.servings),
  });
  res.status(201).json(await buildDay(userId, date));
}

/** Removes a food; if it was the last one standing in for a planned meal, that meal is open again. */
export async function removeEntry(req: Request, res: Response): Promise<void> {
  const { date, id } = validParams<EntryParams>(req);
  const userId = currentUserId(req);
  const removed = await diary.deleteEntry(userId, id);
  if (!removed) throw ApiError.notFound('That food is not in your diary.');

  if (removed.slot && !(await diary.slotHasEntries(userId, date, removed.slot))) {
    const checkins = await diary.listCheckins(userId, date);
    if (checkins.find((checkin) => checkin.slot === removed.slot)?.status === 'swapped') {
      await diary.deleteCheckin(userId, date, removed.slot);
    }
  }
  res.json(await buildDay(userId, date));
}

/** Days logged in a row, ending today (or yesterday, when today has nothing yet). */
async function loggingStreak(userId: string, to: string): Promise<number> {
  const { rows } = await pool.query<{ date: string }>(
    `select distinct to_char(date, 'YYYY-MM-DD') as date from (
       select date from app.meal_checkins where user_id = $1 and date <= $2
       union select date from app.food_entries where user_id = $1 and date <= $2
     ) logged order by date desc limit 400`,
    [userId, to],
  );
  const logged = new Set(rows.map((row) => row.date));
  let cursor = new Date(`${to}T00:00:00`);
  if (!logged.has(to)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (logged.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * The dashboard and progress numbers: calories eaten per day, the logging streak, and how
 * the last seven days went — planned meals eaten, and fully tracked days that hit the target.
 */
export async function getSummary(req: Request, res: Response): Promise<void> {
  const { to, days } = validQuery<SummaryQuery>(req);
  const userId = currentUserId(req);
  const from = toDateKey(addDays(new Date(`${to}T00:00:00`), -(days - 1)));

  const [summaries, streak, { targets, planDay }] = await Promise.all([
    diary.daySummaries(userId, from, to),
    loggingStreak(userId, to),
    targetsFor(userId),
  ]);

  // Fast days plan fewer meals (a Ramadan day has three or four), so count each day's own.
  const mealsPlanned = (date: string) => planDay(date)?.meals.length ?? PLAN_SLOTS.length;
  const week = summaries.slice(-7);
  const tracked = week.filter(
    (day) => day.eatenMeals + day.skippedMeals + day.swappedMeals >= mealsPlanned(day.date),
  );
  const onTarget = targets
    ? tracked.filter((day) => Math.abs(day.kcal - targets.calories) / targets.calories <= ON_TARGET).length
    : 0;

  res.json({
    from,
    to,
    target: targets ? { calories: targets.calories, protein: targets.protein, carbs: targets.carbs, fat: targets.fat } : null,
    days: summaries,
    streak,
    week: {
      plannedMeals: week.reduce((sum, day) => sum + mealsPlanned(day.date), 0),
      eatenAsPlanned: week.reduce((sum, day) => sum + day.eatenMeals, 0),
      trackedDays: tracked.length,
      onTargetDays: onTarget,
    },
  });
}

export async function searchFoods(req: Request, res: Response): Promise<void> {
  const { q } = validQuery<FoodSearchQuery>(req);
  const { meals, custom } = await diary.searchFoods(currentUserId(req), q);
  res.json({ meals, custom });
}

export async function listCustomFoods(req: Request, res: Response): Promise<void> {
  res.json({ foods: await diary.listCustomFoods(currentUserId(req)) });
}

export async function createCustomFood(req: Request, res: Response): Promise<void> {
  const food = validBody<CustomFoodBody>(req);
  res.status(201).json({ food: await diary.insertCustomFood(currentUserId(req), food) });
}

export async function removeCustomFood(req: Request, res: Response): Promise<void> {
  const { id } = validParams<{ id: string }>(req);
  if (!(await diary.deleteCustomFood(currentUserId(req), id))) throw ApiError.notFound('That food is not in your list.');
  res.json({ ok: true });
}

export async function lookupFoodBarcode(req: Request, res: Response): Promise<void> {
  const { code } = validParams<BarcodeParams>(req);
  let product;
  try {
    product = await lookupBarcode(code);
  } catch {
    throw new ApiError(502, 'UPSTREAM_ERROR', 'The product database didn’t answer. Try again, or add it as your own food.');
  }
  if (!product) throw ApiError.notFound('That barcode isn’t in the product database yet. Add it as your own food instead.');
  res.json({ product });
}
