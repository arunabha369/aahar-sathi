import { Router } from 'express';
import { demoLogin, login, logout, me, register } from '../controllers/authController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import { authLimiter } from '../middleware/rateLimit.ts';
import { loginSchema, registerSchema } from '../validation/schemas.ts';

export const authRouter: Router = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), login);
authRouter.post('/demo', authLimiter, demoLogin);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
