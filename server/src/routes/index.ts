import { Router } from 'express';
import { authRouter } from './authRoutes.js';
import { logRouter } from './logRoutes.js';
import { planRouter } from './planRoutes.js';
import { profileRouter } from './profileRoutes.js';
import { deleteAccount } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const apiRouter: Router = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/plans', planRouter);
apiRouter.use('/logs', logRouter);
apiRouter.delete('/account', requireAuth, deleteAccount);
