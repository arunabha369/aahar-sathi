import { Router } from 'express';
import { demoLogin, login, logout, me, register } from '../controllers/authController.ts';
import { googleCallback, googleStart } from '../controllers/googleController.ts';
import { forgotPassword, resetPassword } from '../controllers/passwordController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import { authLimiter } from '../middleware/rateLimit.ts';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validation/schemas.ts';

export const authRouter: Router = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), login);
authRouter.post('/demo', authLimiter, demoLogin);
authRouter.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
authRouter.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), resetPassword);
authRouter.get('/google', authLimiter, googleStart);
authRouter.get('/google/callback', authLimiter, googleCallback);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
