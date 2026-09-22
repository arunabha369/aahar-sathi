import type { MealItem } from '@/lib/types';

const FRACTIONS: Record<string, string> = {
  '0.25': '¼',
  '0.5': '½',
  '0.75': '¾',
};

/** 1.5 → "1½", 0.25 → "¼", 3 → "3" */
export function formatQuantity(qty: number): string {
  const rounded = Math.round(qty * 100) / 100;
  const whole = Math.floor(rounded);
  const fraction = FRACTIONS[(Math.round((rounded - whole) * 100) / 100).toString()];

  if (!fraction) return `${Math.round(rounded * 100) / 100}`;
  return whole === 0 ? fraction : `${whole}${fraction}`;
}

const UNCOUNTABLE = new Set(['g', 'ml', 'tbsp', 'tsp', 'pieces', 'slices']);

function pluralise(unit: string, qty: number): string {
  if (UNCOUNTABLE.has(unit) || qty <= 1) return unit;
  return unit.endsWith('s') ? unit : `${unit}s`;
}

/** "1½ bowls Cooked rice", "3 Whole wheat rotis", "2 Eggs" */
export function formatItem(item: MealItem): string {
  const qty = formatQuantity(item.qty);
  const repeatsUnit = item.food.toLowerCase().includes(item.unit.toLowerCase());

  if (repeatsUnit) {
    const food = item.qty > 1 && !UNCOUNTABLE.has(item.unit) && !item.food.endsWith('s')
      ? `${item.food}s`
      : item.food;
    return `${qty} ${food}`;
  }

  return `${qty} ${pluralise(item.unit, item.qty)} ${item.food}`;
}

/** The browser's own calendar day, so "today" matches the user's timezone. */
export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** 'Mon' … 'Sun' for a given date, matching the plan's day labels. */
export function weekdayKey(date: Date = new Date()): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] ?? 'Mon';
}

export function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatShortDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function litres(glasses: number): string {
  const value = (glasses * 250) / 1000;
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')} L`;
}

export function heightToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

/** 'Mon' … 'Sun' for a 'YYYY-MM-DD' key. */
export function weekdayFromKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return weekdayKey(new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1));
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * "Monday, 21 September" for a 'YYYY-MM-DD' key. Built by hand rather than with
 * Intl so the server and the browser can never disagree during hydration.
 */
export function formatDayLong(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1);
  return `${WEEKDAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

/** '1:00 PM' → 780 (minutes since midnight). */
export function minutesFromTime(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = Number(match[1]) % 12;
  if (match[3]!.toUpperCase() === 'PM') hours += 12;
  return hours * 60 + Number(match[2]);
}

/** "7 h 45 m", or "8 h" on the hour. */
export function formatSleepDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} m`;
}

/** A 24-hour "HH:MM" as "11:15 PM", matching the meal times elsewhere in the app. */
export function formatClock(time: string): string {
  const hours = Number(time.slice(0, 2));
  const minutes = time.slice(3, 5);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  // A no-break space keeps "PM" from wrapping onto its own line.
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes}\u00a0${suffix}`;
}

/** Minutes of sleep from bedtime to waking, wrapping past midnight (the server uses the same rule). */
export function sleepDuration(bedtime: string, wakeTime: string): number {
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  return (toMinutes(wakeTime) - toMinutes(bedtime) + 1440) % 1440;
}

/**
 * The typical bedtime across nights. Bedtimes straddle midnight (23:30, 00:15), so times
 * before noon count as "late" before averaging — otherwise 23:00 and 01:00 would average to noon.
 */
export function averageBedtime(bedtimes: string[]): string | null {
  if (bedtimes.length === 0) return null;
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const shifted = bedtimes.map((time) => {
    const minutes = toMinutes(time);
    return minutes < 12 * 60 ? minutes + 1440 : minutes;
  });
  const mean = Math.round(shifted.reduce((sum, value) => sum + value, 0) / shifted.length) % 1440;
  return `${String(Math.floor(mean / 60)).padStart(2, '0')}:${String(mean % 60).padStart(2, '0')}`;
}

/**
 * "22 Sept 2026 · 4:05 PM" for a timestamp, in India time. Worked out by hand rather than with
 * Intl, so the server and the browser always print the same thing.
 */
export function formatPlanMoment(iso: string): string {
  const ist = new Date(Date.parse(iso) + 330 * 60_000);
  const date = ist.toISOString().slice(0, 10);
  const time = `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`;
  return `${formatDate(date)} · ${formatClock(time)}`;
}
