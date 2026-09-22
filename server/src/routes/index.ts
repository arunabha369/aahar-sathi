import { Router } from 'express';
import { authRouter } from './authRoutes.ts';
import { diaryRouter, foodRouter } from './diaryRoutes.ts';
import { fastingRouter, householdRouter, pantryRouter, recipeRouter, reminderRouter } from './featureRoutes.ts';
import { logRouter } from './logRoutes.ts';
import { planRouter } from './planRoutes.ts';
import { profileRouter } from './profileRoutes.ts';
import { deleteAccount } from '../controllers/authController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';

export const apiRouter: Router = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/plans', planRouter);
apiRouter.use('/logs', logRouter);
apiRouter.use('/diary', diaryRouter);
apiRouter.use('/foods', foodRouter);
apiRouter.use('/recipes', recipeRouter);
apiRouter.use('/fasting', fastingRouter);
apiRouter.use('/household', householdRouter);
apiRouter.use('/pantry', pantryRouter);
apiRouter.use('/reminders', reminderRouter);
apiRouter.delete('/account', requireAuth, deleteAccount);
