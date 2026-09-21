import { Router } from 'express';
import { authRouter } from './authRoutes.ts';
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
apiRouter.delete('/account', requireAuth, deleteAccount);
