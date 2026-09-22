import type { Request, Response } from 'express';
import { CITIES, cityFor } from '../data/cities.ts';
import { findPreferences } from '../db/users.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import { validQuery } from '../middleware/validate.ts';
import { addDays, ekadashiDays, ramadanTimes, todayInIndia } from '../services/almanac.ts';
import { planWeekDates } from '../services/planService.ts';
import { WEEKDAYS, type Weekday } from '../types.ts';
import type { FastingQuery } from '../validation/schemas.ts';

const weekdayOf = (date: string): Weekday => WEEKDAYS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]!;

/**
 * Fasting information for the coming week: the Ekadashi days, and sehri and iftar for each
 * day, for the user's city (or one asked for).
 */
export async function getFastingWeek(req: Request, res: Response): Promise<void> {
  const query = validQuery<FastingQuery>(req);
  const preferences = await findPreferences(currentUserId(req));
  const cityKey = query.city ?? preferences.city;
  const city = cityFor(cityKey);
  const today = query.today ?? todayInIndia();
  const dates = planWeekDates(today);

  res.json({
    city: { key: city.key, name: city.name, chosen: cityKey !== null },
    today,
    ekadashi: ekadashiDays(today, 30, city).map((day) => ({ ...day, weekday: weekdayOf(day.date) })),
    ramadan: Array.from({ length: 7 }, (_, offset) => {
      const date = addDays(today, offset);
      return { ...ramadanTimes(date, city), weekday: weekdayOf(date) };
    }),
    weekDates: dates,
  });
}

export function listCities(_req: Request, res: Response): void {
  res.set('Cache-Control', 'public, max-age=86400');
  res.json({ cities: CITIES.map(({ key, name }) => ({ key, name })) });
}
