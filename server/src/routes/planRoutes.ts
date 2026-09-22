import { Router } from 'express';
import {
  activatePlan,
  createPlan,
  deletePlan,
  getActivePlan,
  getGroceryList,
  getPrepPlan,
  getPlan,
  listPlans,
  shufflePlan,
  swapMeal,
  updateGroceryItem,
} from '../controllers/planController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import { planLimiter } from '../middleware/rateLimit.ts';
import { grocerySchema, idParamSchema, plansQuerySchema, swapSchema } from '../validation/schemas.ts';

export const planRouter: Router = Router();

planRouter.use(requireAuth);

planRouter.post('/', planLimiter, createPlan);
planRouter.get('/', validate({ query: plansQuerySchema }), listPlans);
planRouter.get('/active', getActivePlan);
planRouter.get('/:id', validate({ params: idParamSchema }), getPlan);
planRouter.post('/:id/activate', validate({ params: idParamSchema }), activatePlan);
planRouter.delete('/:id', validate({ params: idParamSchema }), deletePlan);
planRouter.post('/:id/swap', validate({ params: idParamSchema, body: swapSchema }), swapMeal);
planRouter.post('/:id/shuffle', planLimiter, validate({ params: idParamSchema }), shufflePlan);
planRouter.get('/:id/grocery', validate({ params: idParamSchema }), getGroceryList);
planRouter.patch('/:id/grocery', validate({ params: idParamSchema, body: grocerySchema }), updateGroceryItem);
planRouter.get('/:id/prep', validate({ params: idParamSchema }), getPrepPlan);
