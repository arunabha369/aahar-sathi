import { pool } from './pool.ts';
import type { PlannerMeal } from '../services/planGenerator.ts';
import type { MealData } from '../types.ts';

export async function listMeals(): Promise<PlannerMeal[]> {
  const { rows } = await pool.query<PlannerMeal>(
    `select id, slug, name, slot, diet, region, items, kcal, protein, carbs, fat, ingredients, tags
     from app.meals
     order by slug`,
  );
  return rows;
}

/**
 * Makes the meal table match `meals` exactly: upserts by slug (keeping each meal's id)
 * and removes meals that are no longer in the list. Returns what changed.
 */
export async function syncMeals(meals: MealData[]): Promise<{ added: number; updated: number; removed: number }> {
  const { rows } = await pool.query<{ inserted: boolean }>(
    `insert into app.meals (slug, name, slot, diet, region, items, ingredients, kcal, protein, carbs, fat, tags)
     select m.slug, m.name, m.slot, m.diet, m.region, m.items, m.ingredients, m.kcal, m.protein, m.carbs, m.fat,
       coalesce(m.tags, '{}')
     from jsonb_to_recordset($1::jsonb) as m(
       slug text, name text, slot text, diet text, region text, items jsonb, ingredients jsonb,
       kcal double precision, protein double precision, carbs double precision, fat double precision, tags text[]
     )
     on conflict (slug) do update set
       name = excluded.name,
       slot = excluded.slot,
       diet = excluded.diet,
       region = excluded.region,
       items = excluded.items,
       ingredients = excluded.ingredients,
       kcal = excluded.kcal,
       protein = excluded.protein,
       carbs = excluded.carbs,
       fat = excluded.fat,
       tags = excluded.tags
     returning (xmax = 0) as inserted`,
    [JSON.stringify(meals)],
  );

  const removed = await pool.query('delete from app.meals where slug <> all($1::text[])', [
    meals.map((meal) => meal.slug),
  ]);

  const added = rows.filter((row) => row.inserted).length;
  return { added, updated: rows.length - added, removed: removed.rowCount ?? 0 };
}
