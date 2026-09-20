import type { Request, Response } from 'express';
import { Plan } from '../models/Plan.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { currentUserId } from '../middleware/requireAuth.js';
import { validBody, validParams, validQuery } from '../middleware/validate.js';
import { buildGroceryList } from '../services/grocery.js';
import { generatePlanDays, swapMealInDays } from '../services/planGenerator.js';
import { createPlanForUser, loadPlannerMeals } from '../services/planService.js';
import { toPlanSummary, toPublicPlan } from '../utils/serialize.js';
import type { GroceryBody, IdParams, PlansQuery, SwapBody } from '../validation/schemas.js';
import type { Profile } from '../types.js';

/** Loads one of the current user's plans, or 404s — never another user's plan. */
async function findOwnedPlan(req: Request, id: string) {
  const plan = await Plan.findOne({ _id: id, user: currentUserId(req) });
  if (!plan) throw ApiError.notFound('We could not find that plan.');
  return plan;
}

export async function createPlan(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();
  if (!user.profileComplete) {
    throw ApiError.badRequest('Please finish your profile before generating a plan.');
  }

  const plan = await createPlanForUser({ userId, profile: user.profile as Profile });
  res.status(201).json({ plan: toPublicPlan(plan) });
}

export async function listPlans(req: Request, res: Response): Promise<void> {
  const { page, limit } = validQuery<PlansQuery>(req);
  const filter = { user: currentUserId(req) };

  const [plans, total] = await Promise.all([
    Plan.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Plan.countDocuments(filter),
  ]);

  res.json({
    plans: plans.map(toPlanSummary),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function getActivePlan(req: Request, res: Response): Promise<void> {
  const plan = await Plan.findOne({ user: currentUserId(req), isActive: true }).sort({ createdAt: -1 });
  res.json({ plan: plan ? toPublicPlan(plan) : null });
}

export async function getPlan(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const plan = await findOwnedPlan(req, id);
  res.json({ plan: toPublicPlan(plan) });
}

export async function activatePlan(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const userId = currentUserId(req);
  const plan = await findOwnedPlan(req, id);

  await Plan.updateMany({ user: userId, isActive: true }, { $set: { isActive: false } });
  plan.isActive = true;
  await plan.save();

  res.json({ plan: toPublicPlan(plan) });
}

export async function deletePlan(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const plan = await findOwnedPlan(req, id);
  const wasActive = plan.isActive;
  await plan.deleteOne();

  // Keep exactly one active plan: promote the most recent survivor.
  if (wasActive) {
    const latest = await Plan.findOne({ user: currentUserId(req) }).sort({ createdAt: -1 });
    if (latest) {
      latest.isActive = true;
      await latest.save();
    }
  }

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
  plan.days = swapMealInDays({
    days: plan.days,
    dayIndex,
    slot,
    profile: plan.inputs,
    targets: plan.targets,
    meals,
  });
  plan.markModified('days');
  await plan.save();

  res.json({ plan: toPublicPlan(plan) });
}

export async function shufflePlan(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const plan = await findOwnedPlan(req, id);

  const meals = await loadPlannerMeals();
  plan.days = generatePlanDays({ profile: plan.inputs, targets: plan.targets, meals });

  // Ingredients change with the meals, so keep only the ticks that still apply.
  const stillNeeded = new Set(
    buildGroceryList(plan.days).groups.flatMap((group) => group.items),
  );
  plan.groceryChecked = plan.groceryChecked.filter((item) => stillNeeded.has(item));
  plan.markModified('days');
  await plan.save();

  res.json({ plan: toPublicPlan(plan) });
}

export async function getGroceryList(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const plan = await findOwnedPlan(req, id);
  const list = buildGroceryList(plan.days);

  res.json({
    planId: plan._id.toString(),
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

  const updated = await Plan.findByIdAndUpdate(
    plan._id,
    checked ? { $addToSet: { groceryChecked: item } } : { $pull: { groceryChecked: item } },
    { returnDocument: 'after' },
  );

  res.json({ checked: updated?.groceryChecked ?? [] });
}
