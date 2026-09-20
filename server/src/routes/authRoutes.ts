import { Router } from 'express';
import { demoLogin, login, logout, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';

export const authRouter: Router = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), login);
authRouter.post('/demo', authLimiter, demoLogin);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
