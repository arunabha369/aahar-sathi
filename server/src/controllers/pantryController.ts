import type { Request, Response } from 'express';
import { clearPantry, listPantry, setPantryItem } from '../db/pantry.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import { validBody } from '../middleware/validate.ts';
import type { PantryBody } from '../validation/schemas.ts';

export async function getPantry(req: Request, res: Response): Promise<void> {
  res.json({ items: await listPantry(currentUserId(req)) });
}

/** "Have it at home" on a grocery item. Kept across plans, since staples outlast a week. */
export async function updatePantry(req: Request, res: Response): Promise<void> {
  const { item, atHome } = validBody<PantryBody>(req);
  const userId = currentUserId(req);
  await setPantryItem(userId, item, atHome);
  res.json({ items: await listPantry(userId) });
}

export async function resetPantry(req: Request, res: Response): Promise<void> {
  await clearPantry(currentUserId(req));
  res.json({ items: [] });
}
