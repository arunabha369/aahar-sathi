import type { Request, Response } from 'express';
import * as plans from '../db/plans.ts';
import { findUserById } from '../db/users.ts';
import { ApiError } from '../utils/ApiError.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import { validBody, validParams, validQuery } from '../middleware/validate.ts';
import { buildGroceryList } from '../services/grocery.ts';
import { generatePlanDays, swapMealInDays } from '../services/planGenerator.ts';
import { createPlanForUser, loadPlannerMeals } from '../services/planService.ts';
import { toPlanSummary, toPublicPlan } from '../utils/serialize.ts';
import type { GroceryBody, IdParams, PlansQuery, SwapBody } from '../validation/schemas.ts';
import type { Profile } from '../types.ts';

const planNotFound = () => ApiError.notFound('We could not find that plan.');

/** Loads one of the current user's plans, or 404s — never another user's plan. */
async function findOwnedPlan(req: Request, id: string) {
  const plan = await plans.findOwnedPlan(id, currentUserId(req));
  if (!plan) throw planNotFound();
  return plan;
}

export async function createPlan(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const user = await findUserById(userId);
  if (!user) throw ApiError.unauthorized();
  if (!user.profileComplete) {
    throw ApiError.badRequest('Please finish your profile before generating a plan.');
  }

  const plan = await createPlanForUser({ userId, profile: user.profile as Profile });
  res.status(201).json({ plan: toPublicPlan(plan) });
}

export async function listPlans(req: Request, res: Response): Promise<void> {
  const { page, limit } = validQuery<PlansQuery>(req);
  const { plans: rows, total } = await plans.listPlans(currentUserId(req), { page, limit });

  res.json({
    plans: rows.map(toPlanSummary),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function getActivePlan(req: Request, res: Response): Promise<void> {
  const plan = await plans.findActivePlan(currentUserId(req));
  res.json({ plan: plan ? toPublicPlan(plan) : null });
}

export async function getPlan(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const plan = await findOwnedPlan(req, id);
  res.json({ plan: toPublicPlan(plan) });
}

export async function activatePlan(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const plan = await plans.activatePlan(id, currentUserId(req));
  if (!plan) throw planNotFound();
  res.json({ plan: toPublicPlan(plan) });
}

export async function deletePlan(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  // Keeps exactly one active plan: the most recent survivor is promoted if needed.
  if (!(await plans.deletePlan(id, currentUserId(req)))) throw planNotFound();
  res.json({ ok: true });
}

export async function swapMeal(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const { dayIndex, slot } = validBody<SwapBody>(req);
  const plan = await findOwnedPlan(req, id);

  if (dayIndex >= plan.days.length) {
    throw ApiError.badRequest('That day is not part of this plan.');
  }

  const meals = await loadPlannerMeals();
  const days = swapMealInDays({
    days: plan.days,
    dayIndex,
    slot,
    profile: plan.inputs,
    targets: plan.targets,
    meals,
  });

  const updated = await plans.updatePlanDays(plan.id, plan.userId, days);
  if (!updated) throw planNotFound();
  res.json({ plan: toPublicPlan(updated) });
}

export async function shufflePlan(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const plan = await findOwnedPlan(req, id);

  const meals = await loadPlannerMeals();
  const days = generatePlanDays({ profile: plan.inputs, targets: plan.targets, meals });

  // Ingredients change with the meals, so keep only the ticks that still apply.
  const stillNeeded = new Set(buildGroceryList(days).groups.flatMap((group) => group.items));
  const groceryChecked = plan.groceryChecked.filter((item) => stillNeeded.has(item));

  const updated = await plans.updatePlanDays(plan.id, plan.userId, days, groceryChecked);
  if (!updated) throw planNotFound();
  res.json({ plan: toPublicPlan(updated) });
}

export async function getGroceryList(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const plan = await findOwnedPlan(req, id);
  const list = buildGroceryList(plan.days);

  res.json({
    planId: plan.id,
    groups: list.groups,
    total: list.total,
    checked: plan.groceryChecked,
  });
}

export async function updateGroceryItem(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const { item, checked } = validBody<GroceryBody>(req);
  const plan = await findOwnedPlan(req, id);

  const known = new Set(buildGroceryList(plan.days).groups.flatMap((group) => group.items));
  if (!known.has(item)) {
    throw ApiError.badRequest('That ingredient is not on this plan’s grocery list.');
  }

  const updated = await plans.toggleGroceryItem(plan.id, plan.userId, item, checked);
  res.json({ checked: updated ?? [] });
}
