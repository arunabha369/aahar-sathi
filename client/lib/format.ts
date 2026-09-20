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
