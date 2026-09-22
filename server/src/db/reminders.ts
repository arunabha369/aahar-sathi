import { pool } from './pool.ts';
import type { ReminderSettings } from '../types.ts';

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Saves a browser's subscription. The same browser signing in as someone else moves to them. */
export async function upsertSubscription(
  userId: string,
  subscription: { endpoint: string; p256dh: string; auth: string },
): Promise<void> {
  await pool.query(
    `insert into app.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, $3, $4)
     on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    [userId, subscription.endpoint, subscription.p256dh, subscription.auth],
  );
}

export async function deleteSubscription(userId: string, endpoint: string): Promise<void> {
  await pool.query('delete from app.push_subscriptions where user_id = $1 and endpoint = $2', [userId, endpoint]);
}

/** The push service says this subscription is gone (the user blocked or uninstalled). */
export async function deleteSubscriptionById(id: string): Promise<void> {
  await pool.query('delete from app.push_subscriptions where id = $1', [id]);
}

export async function markSubscriptionSent(id: string): Promise<void> {
  await pool.query('update app.push_subscriptions set last_sent_at = now() where id = $1', [id]);
}

export async function listSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
  const { rows } = await pool.query<PushSubscriptionRecord>(
    'select id, endpoint, p256dh, auth from app.push_subscriptions where user_id = $1',
    [userId],
  );
  return rows;
}

export async function countSubscriptions(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: number }>(
    'select count(*)::int as count from app.push_subscriptions where user_id = $1',
    [userId],
  );
  return rows[0]?.count ?? 0;
}

export interface StoredReminderSettings {
  timezone: string;
  settings: ReminderSettings;
}

export async function findReminderSettings(userId: string): Promise<StoredReminderSettings | null> {
  const { rows } = await pool.query<StoredReminderSettings>(
    'select timezone, settings from app.reminder_settings where user_id = $1',
    [userId],
  );
  return rows[0] ?? null;
}

export async function saveReminderSettings(userId: string, value: StoredReminderSettings): Promise<void> {
  await pool.query(
    `insert into app.reminder_settings (user_id, timezone, settings) values ($1, $2, $3::jsonb)
     on conflict (user_id) do update set timezone = excluded.timezone, settings = excluded.settings`,
    [userId, value.timezone, JSON.stringify(value.settings)],
  );
}

/** Everyone who could get a reminder now: settings saved and at least one device subscribed. */
export async function listReminderRecipients(): Promise<(StoredReminderSettings & { userId: string })[]> {
  const { rows } = await pool.query<StoredReminderSettings & { userId: string }>(
    `select rs.user_id as "userId", rs.timezone, rs.settings
     from app.reminder_settings rs
     where exists (select 1 from app.push_subscriptions ps where ps.user_id = rs.user_id)`,
  );
  return rows;
}

/** Claims a reminder so it is sent once, even if two scheduler runs overlap. */
export async function claimReminder(userId: string, key: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'insert into app.reminder_log (user_id, key) values ($1, $2) on conflict do nothing',
    [userId, key],
  );
  return rowCount === 1;
}

export async function pruneReminderLog(): Promise<void> {
  await pool.query(`delete from app.reminder_log where sent_at < now() - interval '3 days'`);
}

export async function deleteRemindersForUser(userId: string): Promise<void> {
  await pool.query('delete from app.push_subscriptions where user_id = $1', [userId]);
  await pool.query('delete from app.reminder_settings where user_id = $1', [userId]);
  await pool.query('delete from app.reminder_log where user_id = $1', [userId]);
}
