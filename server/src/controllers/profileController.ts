import type { Request, Response } from 'express';
import { listWeightLogs } from '../db/logs.ts';
import { findPreferences, findUserById, saveProfile, updatePreferences } from '../db/users.ts';
import { ApiError } from '../utils/ApiError.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import { validBody, validQuery } from '../middleware/validate.ts';
import { addDays, todayInIndia } from '../services/almanac.ts';
import { suggestAdjustment, TREND_WINDOW_DAYS, type AdjustmentSuggestion } from '../services/adaptiveTargets.ts';
import { calculateTargets } from '../services/nutrition.ts';
import { createPlanForUser } from '../services/planService.ts';
import { toPublicPlan, toPublicUser } from '../utils/serialize.ts';
import type { Profile, UserPreferences } from '../types.ts';
import type { AdjustmentBody, PreferencesBody, ProfileBody, TodayQuery } from '../validation/schemas.ts';

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const [user, preferences] = await Promise.all([findUserById(userId), findPreferences(userId)]);
  if (!user) throw ApiError.unauthorized();

  res.json({
    profile: user.profile ?? {},
    profileComplete: user.profileComplete,
    preferences,
    // Targets are handy on the settings page before a new plan is generated.
    targets: user.profileComplete
      ? calculateTargets(user.profile as ProfileBody, { calorieAdjustment: preferences.calorieAdjustment })
      : null,
  });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const profile = validBody<ProfileBody>(req);
  const userId = currentUserId(req);

  const user = await saveProfile(userId, profile);
  if (!user) throw ApiError.unauthorized();
  const preferences = await findPreferences(userId);

  res.json({
    user: toPublicUser(user),
    profile: user.profile,
    targets: calculateTargets(profile, { calorieAdjustment: preferences.calorieAdjustment }),
  });
}

/** Plan preferences only; the calorie adjustment has its own endpoints. */
function planPreferences(preferences: UserPreferences) {
  const { jain, fasting, vratDays, city } = preferences;
  return { jain, fasting, vratDays, city };
}

export async function getPreferences(req: Request, res: Response): Promise<void> {
  res.json({ preferences: planPreferences(await findPreferences(currentUserId(req))) });
}

export async function savePreferences(req: Request, res: Response): Promise<void> {
  const body = validBody<PreferencesBody>(req);
  const preferences = await updatePreferences(currentUserId(req), body);
  if (!preferences) throw ApiError.unauthorized();
  res.json({ preferences: planPreferences(preferences) });
}

async function currentSuggestion(userId: string, today: string): Promise<AdjustmentSuggestion> {
  const [user, preferences] = await Promise.all([findUserById(userId), findPreferences(userId)]);
  if (!user) throw ApiError.unauthorized();
  if (!user.profileComplete) throw ApiError.badRequest('Please finish your profile first.');
  const profile = user.profile as Profile;
  // A little more than the trend window, so the first weigh-in of it is never cut off by timezones.
  const weights = await listWeightLogs(userId, { from: addDays(today, -(TREND_WINDOW_DAYS + 1)), to: today });
  const { calories } = calculateTargets(profile, { calorieAdjustment: preferences.calorieAdjustment });
  return suggestAdjustment({ goal: profile.goal, gender: profile.gender, calories, weights, today, preferences });
}

export async function getAdjustment(req: Request, res: Response): Promise<void> {
  const { today = todayInIndia() } = validQuery<TodayQuery>(req);
  res.json({ suggestion: await currentSuggestion(currentUserId(req), today) });
}

/**
 * Accepts the current suggestion and makes a new plan with the new target. The change must
 * match what the trend suggests right now, so a stale screen can't apply the wrong one.
 */
export async function applyAdjustment(req: Request, res: Response): Promise<void> {
  const { change } = validBody<AdjustmentBody>(req);
  const { today = todayInIndia() } = validQuery<TodayQuery>(req);
  const userId = currentUserId(req);
  const suggestion = await currentSuggestion(userId, today);
  if (suggestion.status !== 'suggest' || suggestion.change !== change) {
    throw ApiError.conflict('That suggestion no longer applies. Refresh to see the latest one.');
  }

  const preferences = await updatePreferences(userId, {
    calorieAdjustment: suggestion.currentAdjustment + change,
    calorieAdjustedAt: new Date().toISOString(),
    suggestionDismissedAt: null,
  });
  if (!preferences) throw ApiError.unauthorized();
  const user = await findUserById(userId);
  const plan = await createPlanForUser({ userId, profile: user!.profile as Profile });
  res.json({ calorieAdjustment: preferences.calorieAdjustment, targets: plan.targets, plan: toPublicPlan(plan) });
}

export async function dismissAdjustment(req: Request, res: Response): Promise<void> {
  const preferences = await updatePreferences(currentUserId(req), { suggestionDismissedAt: new Date().toISOString() });
  if (!preferences) throw ApiError.unauthorized();
  res.json({ ok: true });
}

/** Back to the calculated target, with a new plan to match. */
export async function resetAdjustment(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const user = await findUserById(userId);
  if (!user) throw ApiError.unauthorized();
  await updatePreferences(userId, { calorieAdjustment: 0, calorieAdjustedAt: null, suggestionDismissedAt: null });
  if (!user.profileComplete) {
    res.json({ calorieAdjustment: 0, plan: null });
    return;
  }
  const plan = await createPlanForUser({ userId, profile: user.profile as Profile });
  res.json({ calorieAdjustment: 0, targets: plan.targets, plan: toPublicPlan(plan) });
}
