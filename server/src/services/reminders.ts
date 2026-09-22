import webpush from 'web-push';
import { env, remindersEnabled } from '../config/env.ts';
import { listCheckins } from '../db/diary.ts';
import { listWaterLogs, listWeightLogs } from '../db/logs.ts';
import { findActivePlan } from '../db/plans.ts';
import {
  claimReminder,
  deleteSubscriptionById,
  listReminderRecipients,
  listSubscriptions,
  markSubscriptionSent,
  pruneReminderLog,
  type PushSubscriptionRecord,
} from '../db/reminders.ts';
import { onDate } from './fastTimes.ts';
import { SLOT_META, WEEKDAYS, type PlanDay, type PlanSlot, type ReminderSettings, type Weekday } from '../types.ts';

/**
 * A reminder goes out on the first scheduler run at or after its time, and no later than
 * this many minutes after it — so a run that is late or skipped doesn't send stale nudges.
 */
export const SEND_WINDOW_MINUTES = 20;

export interface LocalTime {
  date: string;
  weekday: Weekday;
  /** Minutes after local midnight. */
  minutes: number;
}

/** The wall-clock date and time in a timezone. */
export function localTime(now: Date, timezone: string): LocalTime {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday as Weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

const toMinutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
const clock24 = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** "7:00 AM" / "12:30 PM" → minutes after midnight. */
export function planTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]) % 12;
  const pm = match[3]!.toUpperCase() === 'PM';
  return (hours + (pm ? 12 : 0)) * 60 + Number(match[2]);
}

/** "18:22" → "6:22 PM", for message text. */
function friendlyClock(hhmm: string): string {
  const minutes = toMinutes(hhmm);
  const hours = Math.floor(minutes / 60);
  return `${hours % 12 === 0 ? 12 : hours % 12}:${String(minutes % 60).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

export interface Reminder {
  /** Unique per user per local day, so each reminder is sent once. */
  key: string;
  title: string;
  body: string;
  url: string;
}

export interface ReminderContext {
  now: LocalTime;
  settings: ReminderSettings;
  /** Today's plan day, if there is an active plan. */
  planDay: PlanDay | null;
  checkedIn: Set<PlanSlot>;
  waterGlasses: number;
  waterTarget: number | null;
  weighedToday: boolean;
}

const isDue = (scheduled: number, now: number) => now >= scheduled && now < scheduled + SEND_WINDOW_MINUTES;

/** The reminders due at this moment. Pure: the caller decides what has already been sent. */
export function dueReminders({ now, settings, planDay, checkedIn, waterGlasses, waterTarget, weighedToday }: ReminderContext): Reminder[] {
  const due: Reminder[] = [];

  if (settings.water.enabled && (waterTarget === null || waterGlasses < waterTarget)) {
    for (let at = toMinutes(settings.water.from); at <= toMinutes(settings.water.to); at += settings.water.everyMinutes) {
      if (!isDue(at, now.minutes)) continue;
      due.push({
        key: `${now.date}:water:${clock24(at)}`,
        title: 'Time for a glass of water',
        body:
          waterTarget === null
            ? 'A glass now keeps you on track.'
            : `You’ve had ${waterGlasses} of ${waterTarget} glasses today.`,
        url: '/dashboard',
      });
    }
  }

  if (settings.meals.enabled && planDay) {
    for (const meal of planDay.meals) {
      if (checkedIn.has(meal.slot)) continue;
      const mealAt = planTimeToMinutes(meal.time);
      if (mealAt === null) continue;
      const at = mealAt - settings.meals.minutesBefore;
      if (at < 0 || !isDue(at, now.minutes)) continue;
      const label = meal.label ?? SLOT_META[meal.slot].label;
      let body = meal.name;
      if (meal.label === 'Sehri' && planDay.fastTimes) body += ` · Sehri ends at ${friendlyClock(planDay.fastTimes.sehriEnds)}`;
      if (meal.label === 'Iftar' && planDay.fastTimes) body += ` · Iftar at ${friendlyClock(planDay.fastTimes.iftar)}`;
      due.push({
        key: `${now.date}:meal:${meal.slot}`,
        title: settings.meals.minutesBefore > 0 ? `${label} in ${settings.meals.minutesBefore} minutes` : `${label} time`,
        body,
        url: '/diary',
      });
    }
  }

  if (
    settings.weighIn.enabled &&
    !weighedToday &&
    settings.weighIn.days.includes(now.weekday) &&
    isDue(toMinutes(settings.weighIn.time), now.minutes)
  ) {
    due.push({
      key: `${now.date}:weigh`,
      title: 'Weigh-in',
      body: 'Step on the scale before breakfast — same time each week keeps the trend honest.',
      url: '/progress',
    });
  }

  if (settings.bedtime.enabled && isDue(toMinutes(settings.bedtime.time), now.minutes)) {
    due.push({
      key: `${now.date}:bed`,
      title: 'Time to wind down',
      body: 'Put the screens away and get ready for bed.',
      url: '/progress',
    });
  }

  return due;
}

let vapidReady = false;
function ensureVapid(): void {
  if (vapidReady) return;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
  vapidReady = true;
}

/** Sends one notification to every device of a user; drops devices the push service says are gone. */
export async function sendToUser(
  userId: string,
  message: Omit<Reminder, 'key'> & { tag?: string },
  subscriptions?: PushSubscriptionRecord[],
): Promise<number> {
  if (!remindersEnabled) return 0;
  ensureVapid();
  const targets = subscriptions ?? (await listSubscriptions(userId));
  const payload = JSON.stringify(message);
  let delivered = 0;
  await Promise.all(
    targets.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
          { TTL: SEND_WINDOW_MINUTES * 60, urgency: 'normal' },
        );
        delivered += 1;
        await markSubscriptionSent(subscription.id);
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await deleteSubscriptionById(subscription.id);
        else console.error(`Push to ${new URL(subscription.endpoint).host} failed (${status ?? 'network'}).`);
      }
    }),
  );
  return delivered;
}

const weekdayOf = (date: string): Weekday => WEEKDAYS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]!;

/** One scheduler tick: works out and sends everything due for everyone, once. */
export async function runReminders(now = new Date()): Promise<{ users: number; sent: number }> {
  if (!remindersEnabled) return { users: 0, sent: 0 };
  await pruneReminderLog();
  const recipients = await listReminderRecipients();
  let sent = 0;

  for (const recipient of recipients) {
    try {
      const local = localTime(now, recipient.timezone);
      const [plan, checkins, water, weights] = await Promise.all([
        findActivePlan(recipient.userId),
        listCheckins(recipient.userId, local.date),
        listWaterLogs(recipient.userId, { from: local.date, to: local.date }),
        listWeightLogs(recipient.userId, { from: local.date, to: local.date }),
      ]);
      const planDay = plan?.days.find((day) => day.day === weekdayOf(local.date));
      const due = dueReminders({
        now: local,
        settings: recipient.settings,
        planDay: plan && planDay ? onDate(planDay, local.date, plan.inputs) : null,
        checkedIn: new Set(checkins.map((checkin) => checkin.slot)),
        waterGlasses: water[0]?.glasses ?? 0,
        waterTarget: plan?.targets.waterGlasses ?? null,
        weighedToday: weights.length > 0,
      });
      if (due.length === 0) continue;

      const subscriptions = await listSubscriptions(recipient.userId);
      for (const reminder of due) {
        if (!(await claimReminder(recipient.userId, reminder.key))) continue;
        const { key, ...message } = reminder;
        // One notification per kind replaces the last, so a missed water nudge doesn't pile up.
        sent += await sendToUser(recipient.userId, { ...message, tag: key.split(':')[1] ?? 'reminder' }, subscriptions);
      }
    } catch (error) {
      // One account's bad data must not stop everyone else's reminders.
      console.error('Reminder run failed for one user:', error instanceof Error ? error.message : error);
    }
  }
  return { users: recipients.length, sent };
}
