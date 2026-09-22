import { pool } from './pool.ts';

export interface GroceryExtra {
  id: string;
  name: string;
}

/** The user's own additions to a plan's shopping list, oldest first. */
export async function listExtras(planId: string, userId: string): Promise<GroceryExtra[]> {
  const { rows } = await pool.query<GroceryExtra>(
    'select id, name from app.grocery_extras where plan_id = $1 and user_id = $2 order by created_at, id',
    [planId, userId],
  );
  return rows;
}

/** Adds an item. Adding the same name again keeps the one already there, spelling and all. */
export async function insertExtra(planId: string, userId: string, name: string): Promise<GroceryExtra> {
  const { rows } = await pool.query<GroceryExtra>(
    `insert into app.grocery_extras (plan_id, user_id, name) values ($1, $2, $3)
     on conflict (plan_id, lower(name)) do update set name = app.grocery_extras.name
     returning id, name`,
    [planId, userId, name],
  );
  return rows[0]!;
}

export async function deleteExtra(id: string, userId: string): Promise<GroceryExtra | null> {
  const { rows } = await pool.query<GroceryExtra>(
    'delete from app.grocery_extras where id = $1 and user_id = $2 returning id, name',
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function deleteExtrasForUser(userId: string): Promise<void> {
  await pool.query('delete from app.grocery_extras where user_id = $1', [userId]);
}
