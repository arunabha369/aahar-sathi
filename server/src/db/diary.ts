import { pool } from './pool.ts';
import type { PlanSlot } from '../types.ts';

export type CheckinStatus = 'eaten' | 'skipped' | 'swapped';
export type FoodSource = 'meal' | 'custom' | 'barcode';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Checkin extends Macros {
  slot: PlanSlot;
  status: CheckinStatus;
  mealName: string;
}

export interface FoodEntry extends Macros {
  id: string;
  slot: PlanSlot | null;
  source: FoodSource;
  ref: string | null;
  name: string;
  servingLabel: string;
  servings: number;
  createdAt: Date;
}

export interface CustomFood extends Macros {
  id: string;
  name: string;
  servingLabel: string;
}

const ENTRY_COLUMNS = `id, slot, source, ref, name, serving_label as "servingLabel", servings,
  kcal, protein, carbs, fat, created_at as "createdAt"`;
const FOOD_COLUMNS = 'id, name, serving_label as "servingLabel", kcal, protein, carbs, fat';

export async function listCheckins(userId: string, date: string): Promise<Checkin[]> {
  const { rows } = await pool.query<Checkin>(
    `select slot, status, meal_name as "mealName", kcal, protein, carbs, fat
     from app.meal_checkins where user_id = $1 and date = $2`,
    [userId, date],
  );
  return rows;
}

/** One check-in per planned meal per day; checking in again replaces it. */
export async function upsertCheckin(
  userId: string,
  date: string,
  checkin: Checkin,
): Promise<Checkin> {
  const { rows } = await pool.query<Checkin>(
    `insert into app.meal_checkins (user_id, date, slot, status, meal_name, kcal, protein, carbs, fat)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (user_id, date, slot) do update set
       status = excluded.status, meal_name = excluded.meal_name,
       kcal = excluded.kcal, protein = excluded.protein, carbs = excluded.carbs, fat = excluded.fat
     returning slot, status, meal_name as "mealName", kcal, protein, carbs, fat`,
    [userId, date, checkin.slot, checkin.status, checkin.mealName, checkin.kcal, checkin.protein, checkin.carbs, checkin.fat],
  );
  return rows[0]!;
}

export async function deleteCheckin(userId: string, date: string, slot: PlanSlot): Promise<boolean> {
  const { rowCount } = await pool.query('delete from app.meal_checkins where user_id = $1 and date = $2 and slot = $3', [
    userId,
    date,
    slot,
  ]);
  return rowCount === 1;
}

export async function listEntries(userId: string, date: string): Promise<FoodEntry[]> {
  const { rows } = await pool.query<FoodEntry>(
    `select ${ENTRY_COLUMNS} from app.food_entries where user_id = $1 and date = $2 order by created_at, id`,
    [userId, date],
  );
  return rows;
}

export async function insertEntry(
  userId: string,
  date: string,
  entry: Omit<FoodEntry, 'id' | 'createdAt'>,
): Promise<FoodEntry> {
  const { rows } = await pool.query<FoodEntry>(
    `insert into app.food_entries (user_id, date, slot, source, ref, name, serving_label, servings, kcal, protein, carbs, fat)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning ${ENTRY_COLUMNS}`,
    [
      userId,
      date,
      entry.slot,
      entry.source,
      entry.ref,
      entry.name,
      entry.servingLabel,
      entry.servings,
      entry.kcal,
      entry.protein,
      entry.carbs,
      entry.fat,
    ],
  );
  return rows[0]!;
}

/** Deletes one of the user's entries; returns what it was (for undoing a swap), or null. */
export async function deleteEntry(userId: string, id: string): Promise<FoodEntry | null> {
  const { rows } = await pool.query<FoodEntry & { date: string }>(
    `delete from app.food_entries where id = $1 and user_id = $2 returning ${ENTRY_COLUMNS}, date`,
    [id, userId],
  );
  return rows[0] ?? null;
}

/** Are there still foods logged against this slot on this day? */
export async function slotHasEntries(userId: string, date: string, slot: PlanSlot): Promise<boolean> {
  const { rowCount } = await pool.query('select 1 from app.food_entries where user_id = $1 and date = $2 and slot = $3', [
    userId,
    date,
    slot,
  ]);
  return (rowCount ?? 0) > 0;
}

export interface DaySummary extends Macros {
  date: string;
  eatenMeals: number;
  skippedMeals: number;
  swappedMeals: number;
  entries: number;
}

/**
 * Totals eaten per day over a range: eaten planned meals (their snapshots) plus every food
 * entry. Days with nothing logged are included, as zeros, so the caller sees gaps.
 */
export async function daySummaries(userId: string, from: string, to: string): Promise<DaySummary[]> {
  const { rows } = await pool.query<DaySummary>(
    `with days as (
       select generate_series($2::date, $3::date, interval '1 day')::date as date
     ),
     checkins as (
       select date,
         count(*) filter (where status = 'eaten')::int as eaten,
         count(*) filter (where status = 'skipped')::int as skipped,
         count(*) filter (where status = 'swapped')::int as swapped,
         coalesce(sum(kcal) filter (where status = 'eaten'), 0) as kcal,
         coalesce(sum(protein) filter (where status = 'eaten'), 0) as protein,
         coalesce(sum(carbs) filter (where status = 'eaten'), 0) as carbs,
         coalesce(sum(fat) filter (where status = 'eaten'), 0) as fat
       from app.meal_checkins where user_id = $1 and date between $2 and $3 group by date
     ),
     entries as (
       select date, count(*)::int as n, sum(kcal) as kcal, sum(protein) as protein, sum(carbs) as carbs, sum(fat) as fat
       from app.food_entries where user_id = $1 and date between $2 and $3 group by date
     )
     select to_char(days.date, 'YYYY-MM-DD') as date,
       coalesce(c.eaten, 0) as "eatenMeals",
       coalesce(c.skipped, 0) as "skippedMeals",
       coalesce(c.swapped, 0) as "swappedMeals",
       coalesce(e.n, 0) as entries,
       round((coalesce(c.kcal, 0) + coalesce(e.kcal, 0))::numeric)::int as kcal,
       round((coalesce(c.protein, 0) + coalesce(e.protein, 0))::numeric)::int as protein,
       round((coalesce(c.carbs, 0) + coalesce(e.carbs, 0))::numeric)::int as carbs,
       round((coalesce(c.fat, 0) + coalesce(e.fat, 0))::numeric)::int as fat
     from days
     left join checkins c on c.date = days.date
     left join entries e on e.date = days.date
     order by days.date`,
    [userId, from, to],
  );
  return rows;
}

export async function listCustomFoods(userId: string): Promise<CustomFood[]> {
  const { rows } = await pool.query<CustomFood>(
    `select ${FOOD_COLUMNS} from app.custom_foods where user_id = $1 order by lower(name)`,
    [userId],
  );
  return rows;
}

export async function findCustomFood(userId: string, id: string): Promise<CustomFood | null> {
  const { rows } = await pool.query<CustomFood>(
    `select ${FOOD_COLUMNS} from app.custom_foods where user_id = $1 and id = $2`,
    [userId, id],
  );
  return rows[0] ?? null;
}

export async function insertCustomFood(userId: string, food: Omit<CustomFood, 'id'>): Promise<CustomFood> {
  const { rows } = await pool.query<CustomFood>(
    `insert into app.custom_foods (user_id, name, serving_label, kcal, protein, carbs, fat)
     values ($1, $2, $3, $4, $5, $6, $7) returning ${FOOD_COLUMNS}`,
    [userId, food.name, food.servingLabel, food.kcal, food.protein, food.carbs, food.fat],
  );
  return rows[0]!;
}

export async function deleteCustomFood(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await pool.query('delete from app.custom_foods where user_id = $1 and id = $2', [userId, id]);
  return rowCount === 1;
}

/** Dishes from the meal list and the user's own foods whose names contain the query. */
export async function searchFoods(
  userId: string,
  query: string,
): Promise<{ meals: (Macros & { slug: string; name: string; servingLabel: string })[]; custom: CustomFood[] }> {
  const pattern = `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  const [meals, custom] = await Promise.all([
    pool.query<Macros & { slug: string; name: string; servingLabel: string }>(
      `select slug, name, 'serving' as "servingLabel", kcal, protein, carbs, fat
       from app.meals where name ilike $1 order by position(lower($2) in lower(name)), name limit 20`,
      [pattern, query],
    ),
    pool.query<CustomFood>(
      `select ${FOOD_COLUMNS} from app.custom_foods where user_id = $1 and name ilike $2 order by lower(name) limit 20`,
      [userId, pattern],
    ),
  ]);
  return { meals: meals.rows, custom: custom.rows };
}

export async function findMealBySlug(slug: string): Promise<(Macros & { slug: string; name: string }) | null> {
  const { rows } = await pool.query<Macros & { slug: string; name: string }>(
    'select slug, name, kcal, protein, carbs, fat from app.meals where slug = $1',
    [slug],
  );
  return rows[0] ?? null;
}

/** Clears a user's whole food diary and saved foods (the seed rebuilds the demo account). */
export async function deleteDiaryForUser(userId: string): Promise<void> {
  await pool.query('delete from app.meal_checkins where user_id = $1', [userId]);
  await pool.query('delete from app.food_entries where user_id = $1', [userId]);
  await pool.query('delete from app.custom_foods where user_id = $1', [userId]);
}
