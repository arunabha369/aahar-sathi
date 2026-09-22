import { Router } from 'express';
import { getFastingWeek, listCities } from '../controllers/fastingController.ts';
import { addMember, editMember, listHousehold, removeMember } from '../controllers/householdController.ts';
import { getPantry, resetPantry, updatePantry } from '../controllers/pantryController.ts';
import { getRecipe, listRecipes } from '../controllers/recipeController.ts';
import {
  getReminderSettings,
  runScheduledReminders,
  sendTest,
  subscribe,
  unsubscribe,
  updateReminderSettings,
} from '../controllers/remindersController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import {
  fastingQuerySchema,
  idParamSchema,
  memberSchema,
  pantrySchema,
  pushSubscriptionSchema,
  recipeParamsSchema,
  reminderSettingsSchema,
  unsubscribeSchema,
} from '../validation/schemas.ts';

export const recipeRouter: Router = Router();
recipeRouter.use(requireAuth);
recipeRouter.get('/', listRecipes);
recipeRouter.get('/:slug', validate({ params: recipeParamsSchema }), getRecipe);

export const fastingRouter: Router = Router();
fastingRouter.get('/cities', listCities);
fastingRouter.get('/week', requireAuth, validate({ query: fastingQuerySchema }), getFastingWeek);

export const householdRouter: Router = Router();
householdRouter.use(requireAuth);
householdRouter.get('/', listHousehold);
householdRouter.post('/', validate({ body: memberSchema }), addMember);
householdRouter.put('/:id', validate({ params: idParamSchema, body: memberSchema }), editMember);
householdRouter.delete('/:id', validate({ params: idParamSchema }), removeMember);

export const pantryRouter: Router = Router();
pantryRouter.use(requireAuth);
pantryRouter.get('/', getPantry);
pantryRouter.put('/', validate({ body: pantrySchema }), updatePantry);
pantryRouter.delete('/', resetPantry);

export const reminderRouter: Router = Router();
// The scheduler authenticates with the cron secret, not a user session.
reminderRouter.post('/run', runScheduledReminders);
reminderRouter.get('/run', runScheduledReminders);
reminderRouter.use(requireAuth);
reminderRouter.get('/settings', getReminderSettings);
reminderRouter.put('/settings', validate({ body: reminderSettingsSchema }), updateReminderSettings);
reminderRouter.post('/subscriptions', validate({ body: pushSubscriptionSchema }), subscribe);
reminderRouter.delete('/subscriptions', validate({ body: unsubscribeSchema }), unsubscribe);
reminderRouter.post('/test', sendTest);
