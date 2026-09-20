import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { profileSchema } from '../validation/schemas.js';

export const profileRouter: Router = Router();

profileRouter.use(requireAuth);
profileRouter.get('/', getProfile);
profileRouter.put('/', validate({ body: profileSchema }), updateProfile);
