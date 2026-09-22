import { pool } from './pool.ts';

/** Slugs of the recipes this user has starred. */
export async function listFavourites(userId: string): Promise<string[]> {
  const { rows } = await pool.query<{ slug: string }>(
    'select slug from app.recipe_favourites where user_id = $1 order by created_at desc',
    [userId],
  );
  return rows.map((row) => row.slug);
}

export async function setFavourite(userId: string, slug: string, favourite: boolean): Promise<void> {
  if (favourite) {
    await pool.query(
      'insert into app.recipe_favourites (user_id, slug) values ($1, $2) on conflict do nothing',
      [userId, slug],
    );
  } else {
    await pool.query('delete from app.recipe_favourites where user_id = $1 and slug = $2', [userId, slug]);
  }
}

export async function deleteFavouritesForUser(userId: string): Promise<void> {
  await pool.query('delete from app.recipe_favourites where user_id = $1', [userId]);
}
