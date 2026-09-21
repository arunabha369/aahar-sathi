import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import { profileSchema } from '../validation/schemas.ts';

export const profileRouter: Router = Router();

profileRouter.use(requireAuth);
profileRouter.get('/', getProfile);
profileRouter.put('/', validate({ body: profileSchema }), updateProfile);
