import { pool, withTransaction, type Queryable } from './pool.ts';
import type { PlanDay, PlanInputs, Targets } from '../types.ts';

export interface PlanRecord {
  id: string;
  userId: string;
  inputs: PlanInputs;
  targets: Targets;
  days: PlanDay[];
  groceryChecked: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PLAN_COLUMNS = `id, user_id as "userId", inputs, targets, days, grocery_checked as "groceryChecked",
  is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`;

/**
 * Serialises plan changes per user: whoever gets here second waits for the first
 * transaction, so "exactly one active plan" holds even under double clicks.
 */
async function lockUser(db: Queryable, userId: string): Promise<void> {
  await db.query('select 1 from app.users where id = $1 for update', [userId]);
}

/** One of this user's plans, or null — never another user's plan. */
export async function findOwnedPlan(id: string, userId: string, db: Queryable = pool): Promise<PlanRecord | null> {
  const { rows } = await db.query<PlanRecord>(`select ${PLAN_COLUMNS} from app.plans where id = $1 and user_id = $2`, [
    id,
    userId,
  ]);
  return rows[0] ?? null;
}

export async function findActivePlan(userId: string): Promise<PlanRecord | null> {
  const { rows } = await pool.query<PlanRecord>(
    `select ${PLAN_COLUMNS} from app.plans where user_id = $1 and is_active order by created_at desc limit 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function listPlans(
  userId: string,
  { page, limit }: { page: number; limit: number },
): Promise<{ plans: PlanRecord[]; total: number }> {
  const [list, count] = await Promise.all([
    pool.query<PlanRecord>(
      `select ${PLAN_COLUMNS} from app.plans where user_id = $1 order by created_at desc, id limit $2 offset $3`,
      [userId, limit, (page - 1) * limit],
    ),
    pool.query<{ total: number }>('select count(*)::int as total from app.plans where user_id = $1', [userId]),
  ]);
  return { plans: list.rows, total: count.rows[0]?.total ?? 0 };
}

/** Saves a new plan as the user's active one; any previous active plan becomes history. */
export async function insertActivePlan(input: {
  userId: string;
  inputs: PlanInputs;
  targets: Targets;
  days: PlanDay[];
  groceryChecked?: string[];
}): Promise<PlanRecord> {
  return withTransaction(async (client) => {
    await lockUser(client, input.userId);
    await client.query('update app.plans set is_active = false where user_id = $1 and is_active', [input.userId]);
    const { rows } = await client.query<PlanRecord>(
      `insert into app.plans (user_id, inputs, targets, days, grocery_checked, is_active)
       values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::text[], true)
       returning ${PLAN_COLUMNS}`,
      [
        input.userId,
        JSON.stringify(input.inputs),
        JSON.stringify(input.targets),
        JSON.stringify(input.days),
        input.groceryChecked ?? [],
      ],
    );
    return rows[0]!;
  });
}

/** Makes one of the user's plans the active one. Returns null if it is not theirs. */
export async function activatePlan(id: string, userId: string): Promise<PlanRecord | null> {
  return withTransaction(async (client) => {
    await lockUser(client, userId);
    if (!(await findOwnedPlan(id, userId, client))) return null;
    await client.query('update app.plans set is_active = false where user_id = $1 and is_active and id <> $2', [
      userId,
      id,
    ]);
    const { rows } = await client.query<PlanRecord>(
      `update app.plans set is_active = true where id = $1 returning ${PLAN_COLUMNS}`,
      [id],
    );
    return rows[0] ?? null;
  });
}

/**
 * Deletes one of the user's plans. If it was the active one, the most recent survivor
 * takes over so the dashboard always has a plan. Returns false if it is not theirs.
 */
export async function deletePlan(id: string, userId: string): Promise<boolean> {
  return withTransaction(async (client) => {
    await lockUser(client, userId);
    const { rows } = await client.query<{ isActive: boolean }>(
      'delete from app.plans where id = $1 and user_id = $2 returning is_active as "isActive"',
      [id, userId],
    );
    const deleted = rows[0];
    if (!deleted) return false;

    if (deleted.isActive) {
      await client.query(
        `update app.plans set is_active = true
         where id = (select id from app.plans where user_id = $1 order by created_at desc, id limit 1)`,
        [userId],
      );
    }
    return true;
  });
}

/** Replaces a plan's meals (swap or shuffle), and optionally its grocery ticks. */
export async function updatePlanDays(
  id: string,
  userId: string,
  days: PlanDay[],
  groceryChecked?: string[],
): Promise<PlanRecord | null> {
  const { rows } = await pool.query<PlanRecord>(
    `update app.plans
     set days = $3::jsonb, grocery_checked = coalesce($4::text[], grocery_checked)
     where id = $1 and user_id = $2
     returning ${PLAN_COLUMNS}`,
    [id, userId, JSON.stringify(days), groceryChecked ?? null],
  );
  return rows[0] ?? null;
}

/** Rebuilds a plan in place (edited): new settings, targets and meals, same id and active state. */
export async function replacePlanContent(
  id: string,
  userId: string,
  content: { inputs: PlanInputs; targets: Targets; days: PlanDay[]; groceryChecked: string[] },
): Promise<PlanRecord | null> {
  const { rows } = await pool.query<PlanRecord>(
    `update app.plans
     set inputs = $3::jsonb, targets = $4::jsonb, days = $5::jsonb, grocery_checked = $6::text[]
     where id = $1 and user_id = $2
     returning ${PLAN_COLUMNS}`,
    [id, userId, JSON.stringify(content.inputs), JSON.stringify(content.targets), JSON.stringify(content.days), content.groceryChecked],
  );
  return rows[0] ?? null;
}

export async function setGroceryChecked(id: string, userId: string, groceryChecked: string[]): Promise<void> {
  await pool.query('update app.plans set grocery_checked = $3::text[] where id = $1 and user_id = $2', [
    id,
    userId,
    groceryChecked,
  ]);
}

/** Ticks or unticks one grocery item in a single statement, so concurrent taps cannot lose each other. */
export async function toggleGroceryItem(
  id: string,
  userId: string,
  item: string,
  checked: boolean,
): Promise<string[] | null> {
  const { rows } = await pool.query<{ groceryChecked: string[] }>(
    `update app.plans
     set grocery_checked = case
       when $4 then (case when $3 = any(grocery_checked) then grocery_checked else array_append(grocery_checked, $3) end)
       else array_remove(grocery_checked, $3)
     end
     where id = $1 and user_id = $2
     returning grocery_checked as "groceryChecked"`,
    [id, userId, item, checked],
  );
  return rows[0]?.groceryChecked ?? null;
}

export async function deletePlansForUser(userId: string): Promise<void> {
  await pool.query('delete from app.plans where user_id = $1', [userId]);
}
