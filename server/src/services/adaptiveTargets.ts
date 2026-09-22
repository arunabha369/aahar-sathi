import { addDays } from './almanac.ts';
import { CALORIE_FLOOR, MAX_CALORIE_ADJUSTMENT } from './nutrition.ts';
import type { Gender, Goal, UserPreferences } from '../types.ts';

/** How far back the trend looks, and how much of that window the weigh-ins must cover. */
export const TREND_WINDOW_DAYS = 21;
const MIN_SPAN_DAYS = 14;
const MIN_WEIGH_INS = 4;
/** Each suggestion is one small step, so the change is easy to live with and to judge. */
export const ADJUSTMENT_STEP = 100;
/** After a change, give the body two weeks to show what it did before suggesting another. */
const SETTLE_DAYS = 14;
/** "Not now" keeps suggestions away for a week. */
const DISMISS_DAYS = 7;

/** kg per week. Below this much movement, weight counts as not moving. */
const STALL_KG_PER_WEEK = 0.1;
/** Losing more than 1% of body weight a week is faster than is sensible to keep up. */
const MAX_LOSS_SHARE_PER_WEEK = 0.01;
/** Gaining more than this is mostly fat, not muscle. */
const MAX_GAIN_KG_PER_WEEK = 0.5;
/** On a maintain goal, a drift beyond this either way is worth correcting. */
const MAINTAIN_DRIFT_KG_PER_WEEK = 0.2;

export interface Trend {
  /** Least-squares slope, kg per week (negative is losing). */
  kgPerWeek: number;
  weighIns: number;
  /** Days between the first and last weigh-in in the window. */
  spanDays: number;
  latestKg: number;
}

export type SuggestionStatus =
  | 'not-enough-data'
  | 'on-track'
  | 'suggest'
  | 'recently-adjusted'
  | 'dismissed'
  | 'at-limit';

export interface AdjustmentSuggestion {
  status: SuggestionStatus;
  /** kcal a day to add (positive) or take away (negative); set when status is "suggest". */
  change: number | null;
  reason: string;
  trend: Trend | null;
  currentAdjustment: number;
  /** The first day a suggestion could appear again, for "recently-adjusted" and "dismissed". */
  quietUntil: string | null;
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** The weight trend over the window, or null when there are too few weigh-ins to trust it. */
export function weightTrend(weights: { date: string; weightKg: number }[], today: string): Trend | null {
  const from = addDays(today, -(TREND_WINDOW_DAYS - 1));
  const points = weights
    .filter((entry) => entry.date >= from && entry.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (points.length < MIN_WEIGH_INS) return null;

  const spanDays = daysBetween(points[0]!.date, points.at(-1)!.date);
  if (spanDays < MIN_SPAN_DAYS) return null;

  const xs = points.map((point) => daysBetween(from, point.date));
  const ys = points.map((point) => point.weightKg);
  const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / ys.length;
  let covariance = 0;
  let variance = 0;
  xs.forEach((x, index) => {
    covariance += (x - meanX) * (ys[index]! - meanY);
    variance += (x - meanX) ** 2;
  });
  const kgPerDay = variance === 0 ? 0 : covariance / variance;

  return {
    kgPerWeek: Math.round(kgPerDay * 7 * 100) / 100,
    weighIns: points.length,
    spanDays,
    latestKg: points.at(-1)!.weightKg,
  };
}

export interface SuggestionInput {
  goal: Goal;
  gender: Gender;
  /** Today's calorie target, adjustment included. */
  calories: number;
  weights: { date: string; weightKg: number }[];
  today: string;
  preferences: Pick<UserPreferences, 'calorieAdjustment' | 'calorieAdjustedAt' | 'suggestionDismissedAt'>;
}

const formatKg = (kg: number) => `${Math.abs(kg).toFixed(1)} kg`;

/**
 * Whether the calorie target should move, judged only from the weight trend. It suggests;
 * nothing changes until the user accepts.
 */
export function suggestAdjustment({ goal, gender, calories, weights, today, preferences }: SuggestionInput): AdjustmentSuggestion {
  const currentAdjustment = preferences.calorieAdjustment;
  const base = { currentAdjustment, change: null, quietUntil: null };

  if (preferences.calorieAdjustedAt) {
    const quietUntil = addDays(preferences.calorieAdjustedAt.slice(0, 10), SETTLE_DAYS);
    if (today < quietUntil) {
      return {
        ...base,
        status: 'recently-adjusted',
        reason: 'Your target changed recently. Give it two weeks before judging the new trend.',
        trend: weightTrend(weights, today),
        quietUntil,
      };
    }
  }

  const trend = weightTrend(weights, today);
  if (!trend) {
    return {
      ...base,
      status: 'not-enough-data',
      reason: `Log your weight at least ${MIN_WEIGH_INS} times over two weeks and we can tell whether your target needs a nudge.`,
      trend: null,
    };
  }

  const weeks = Math.max(2, Math.round(trend.spanDays / 7));
  const slope = trend.kgPerWeek;
  let change = 0;
  let reason = '';

  if (goal === 'loss') {
    if (slope > -STALL_KG_PER_WEEK) {
      change = -ADJUSTMENT_STEP;
      reason =
        slope > STALL_KG_PER_WEEK
          ? `Your weight has gone up by about ${formatKg(slope)} a week over the last ${weeks} weeks.`
          : `Your weight has barely moved in ${weeks} weeks.`;
    } else if (-slope > trend.latestKg * MAX_LOSS_SHARE_PER_WEEK) {
      change = ADJUSTMENT_STEP;
      reason = `You are losing about ${formatKg(slope)} a week — faster than 1% of your weight, which is hard to keep up and can cost muscle.`;
    }
  } else if (goal === 'gain') {
    if (slope < STALL_KG_PER_WEEK) {
      change = ADJUSTMENT_STEP;
      reason = `Your weight has barely moved in ${weeks} weeks.`;
    } else if (slope > MAX_GAIN_KG_PER_WEEK) {
      change = -ADJUSTMENT_STEP;
      reason = `You are gaining about ${formatKg(slope)} a week; slower than 0.5 kg a week keeps the gain mostly muscle.`;
    }
  } else if (slope > MAINTAIN_DRIFT_KG_PER_WEEK) {
    change = -ADJUSTMENT_STEP;
    reason = `Your weight has crept up by about ${formatKg(slope)} a week over ${weeks} weeks.`;
  } else if (slope < -MAINTAIN_DRIFT_KG_PER_WEEK) {
    change = ADJUSTMENT_STEP;
    reason = `Your weight has dropped by about ${formatKg(slope)} a week over ${weeks} weeks.`;
  }

  if (change === 0) {
    return { ...base, status: 'on-track', reason: 'Your weight is moving the way your goal needs. Keep going.', trend };
  }

  const nextAdjustment = currentAdjustment + change;
  const belowFloor = change < 0 && calories + change < CALORIE_FLOOR[gender];
  if (Math.abs(nextAdjustment) > MAX_CALORIE_ADJUSTMENT || belowFloor) {
    return {
      ...base,
      status: 'at-limit',
      reason: belowFloor
        ? `${reason} Your target is already at the safe minimum, so more activity is a better lever than eating less — or talk to a dietitian.`
        : `${reason} Your target has already been adjusted as far as we will take it; a dietitian can help from here.`,
      trend,
    };
  }

  if (preferences.suggestionDismissedAt) {
    const quietUntil = addDays(preferences.suggestionDismissedAt.slice(0, 10), DISMISS_DAYS);
    if (today < quietUntil) return { ...base, status: 'dismissed', reason, trend, quietUntil };
  }

  return { ...base, status: 'suggest', change, reason, trend };
}
