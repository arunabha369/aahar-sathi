import { Router } from 'express';
import {
  applyAdjustment,
  dismissAdjustment,
  getAdjustment,
  getPreferences,
  getProfile,
  resetAdjustment,
  savePreferences,
  updateProfile,
} from '../controllers/profileController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { planLimiter } from '../middleware/rateLimit.ts';
import { validate } from '../middleware/validate.ts';
import { adjustmentSchema, preferencesSchema, profileSchema, todayQuerySchema } from '../validation/schemas.ts';

export const profileRouter: Router = Router();

profileRouter.use(requireAuth);
profileRouter.get('/', getProfile);
profileRouter.put('/', validate({ body: profileSchema }), updateProfile);
profileRouter.get('/preferences', getPreferences);
profileRouter.put('/preferences', validate({ body: preferencesSchema }), savePreferences);
profileRouter.get('/adjustment', validate({ query: todayQuerySchema }), getAdjustment);
profileRouter.post('/adjustment', planLimiter, validate({ query: todayQuerySchema, body: adjustmentSchema }), applyAdjustment);
profileRouter.post('/adjustment/dismiss', dismissAdjustment);
profileRouter.delete('/adjustment', planLimiter, resetAdjustment);
