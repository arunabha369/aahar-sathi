import { Router } from 'express';
import {
  activatePlan,
  createPlan,
  deletePlan,
  getActivePlan,
  getGroceryList,
  getPlan,
  listPlans,
  shufflePlan,
  swapMeal,
  updateGroceryItem,
} from '../controllers/planController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { planLimiter } from '../middleware/rateLimit.js';
import { grocerySchema, idParamSchema, plansQuerySchema, swapSchema } from '../validation/schemas.js';

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
