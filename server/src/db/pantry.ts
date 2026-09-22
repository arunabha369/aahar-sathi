import { pool } from './pool.ts';

/** Ingredient names the user has marked "have it at home". */
export async function listPantry(userId: string): Promise<string[]> {
  const { rows } = await pool.query<{ item: string }>(
    'select item from app.pantry_items where user_id = $1 order by item',
    [userId],
  );
  return rows.map((row) => row.item);
}

export async function setPantryItem(userId: string, item: string, atHome: boolean): Promise<void> {
  if (atHome) {
    await pool.query(
      'insert into app.pantry_items (user_id, item) values ($1, $2) on conflict (user_id, item) do nothing',
      [userId, item],
    );
  } else {
    await pool.query('delete from app.pantry_items where user_id = $1 and item = $2', [userId, item]);
  }
}

export async function clearPantry(userId: string): Promise<void> {
  await pool.query('delete from app.pantry_items where user_id = $1', [userId]);
}
