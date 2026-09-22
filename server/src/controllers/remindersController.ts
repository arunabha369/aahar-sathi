import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { env, remindersEnabled } from '../config/env.ts';
import {
  countSubscriptions,
  deleteSubscription,
  findReminderSettings,
  saveReminderSettings,
  upsertSubscription,
} from '../db/reminders.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import { validBody } from '../middleware/validate.ts';
import { runReminders, sendToUser } from '../services/reminders.ts';
import { ApiError } from '../utils/ApiError.ts';
import { DEFAULT_REMINDER_SETTINGS } from '../types.ts';
import type { PushSubscriptionBody, ReminderSettingsBody, UnsubscribeBody } from '../validation/schemas.ts';

function requireReminders(): void {
  if (!remindersEnabled) {
    throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Reminders are not set up on this server yet.');
  }
}

export async function getReminderSettings(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const [stored, devices] = await Promise.all([findReminderSettings(userId), countSubscriptions(userId)]);
  res.json({
    available: remindersEnabled,
    publicKey: remindersEnabled ? env.VAPID_PUBLIC_KEY : null,
    timezone: stored?.timezone ?? null,
    settings: stored?.settings ?? DEFAULT_REMINDER_SETTINGS,
    devices,
  });
}

export async function updateReminderSettings(req: Request, res: Response): Promise<void> {
  const { timezone, ...settings } = validBody<ReminderSettingsBody>(req);
  await saveReminderSettings(currentUserId(req), { timezone, settings });
  res.json({ timezone, settings });
}

export async function subscribe(req: Request, res: Response): Promise<void> {
  requireReminders();
  const { endpoint, keys } = validBody<PushSubscriptionBody>(req);
  const userId = currentUserId(req);
  await upsertSubscription(userId, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
  res.status(201).json({ devices: await countSubscriptions(userId) });
}

export async function unsubscribe(req: Request, res: Response): Promise<void> {
  const { endpoint } = validBody<UnsubscribeBody>(req);
  const userId = currentUserId(req);
  await deleteSubscription(userId, endpoint);
  res.json({ devices: await countSubscriptions(userId) });
}

export async function sendTest(req: Request, res: Response): Promise<void> {
  requireReminders();
  const delivered = await sendToUser(currentUserId(req), {
    title: 'Reminders are on',
    body: 'This is how Aahar Sathi will nudge you. You can change what you get in Settings.',
    url: '/settings',
    tag: 'test',
  });
  if (delivered === 0) {
    throw ApiError.badRequest('No device is set up for reminders. Turn them on again on this device.');
  }
  res.json({ delivered });
}

const digest = (value: string) => createHash('sha256').update(value).digest();

/** The scheduler's call (Supabase pg_cron, or Vercel Cron). Protected by a shared secret. */
export async function runScheduledReminders(req: Request, res: Response): Promise<void> {
  if (!env.CRON_SECRET) throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'CRON_SECRET is not set.');
  const header = req.get('authorization') ?? '';
  // Comparing hashes keeps the comparison constant-time whatever the header's length.
  if (!timingSafeEqual(digest(header), digest(`Bearer ${env.CRON_SECRET}`))) throw ApiError.unauthorized('Not allowed.');
  res.json(await runReminders());
}
