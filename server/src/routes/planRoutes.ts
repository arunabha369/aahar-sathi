import { Router } from 'express';
import {
  activatePlan,
  createPlan,
  previewTargets,
  updatePlan,
  deletePlan,
  getActivePlan,
  addGroceryExtra,
  clearGroceryTicks,
  getGroceryList,
  getPrepPlan,
  removeGroceryExtra,
  getPlan,
  listPlans,
  shufflePlan,
  swapMeal,
  updateGroceryItem,
} from '../controllers/planController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import { planLimiter } from '../middleware/rateLimit.ts';
import {
  extraParamsSchema,
  groceryExtraSchema,
  grocerySchema,
  idParamSchema,
  planRequestSchema,
  plansQuerySchema,
  swapSchema,
  targetsPreviewSchema,
} from '../validation/schemas.ts';

export const planRouter: Router = Router();

planRouter.use(requireAuth);

planRouter.post('/', planLimiter, validate({ body: planRequestSchema }), createPlan);
planRouter.post('/preview', validate({ body: targetsPreviewSchema }), previewTargets);
planRouter.get('/', validate({ query: plansQuerySchema }), listPlans);
planRouter.get('/active', getActivePlan);
planRouter.get('/:id', validate({ params: idParamSchema }), getPlan);
planRouter.post('/:id/activate', validate({ params: idParamSchema }), activatePlan);
planRouter.delete('/:id', validate({ params: idParamSchema }), deletePlan);
planRouter.put('/:id', planLimiter, validate({ params: idParamSchema, body: planRequestSchema }), updatePlan);
planRouter.post('/:id/swap', validate({ params: idParamSchema, body: swapSchema }), swapMeal);
planRouter.post('/:id/shuffle', planLimiter, validate({ params: idParamSchema }), shufflePlan);
planRouter.get('/:id/grocery', validate({ params: idParamSchema }), getGroceryList);
planRouter.patch('/:id/grocery', validate({ params: idParamSchema, body: grocerySchema }), updateGroceryItem);
planRouter.delete('/:id/grocery', validate({ params: idParamSchema }), clearGroceryTicks);
planRouter.post('/:id/grocery/extras', validate({ params: idParamSchema, body: groceryExtraSchema }), addGroceryExtra);
planRouter.delete('/:id/grocery/extras/:extraId', validate({ params: extraParamsSchema }), removeGroceryExtra);
planRouter.get('/:id/prep', validate({ params: idParamSchema }), getPrepPlan);
