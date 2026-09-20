import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { Plan } from '../models/Plan.js';
import { User } from '../models/User.js';
import { WaterLog } from '../models/WaterLog.js';
import { WeightLog } from '../models/WeightLog.js';
import { ApiError } from '../utils/ApiError.js';
import { clearAuthCookie, hashPassword, setAuthCookie, signToken, verifyPassword } from '../utils/auth.js';
import { toPublicUser } from '../utils/serialize.js';
import { validBody } from '../middleware/validate.js';
import { currentUserId } from '../middleware/requireAuth.js';
import type { LoginBody, RegisterBody } from '../validation/schemas.js';

export const DEMO_EMAIL = 'demo@aaharsathi.in';

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = validBody<RegisterBody>(req);

  const existing = await User.exists({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists. Try signing in instead.');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    profile: {},
    profileComplete: false,
  });

  setAuthCookie(res, signToken(user._id.toString()));
  res.status(201).json({ user: toPublicUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = validBody<LoginBody>(req);

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw ApiError.unauthorized('That email and password do not match.');
  }

  setAuthCookie(res, signToken(user._id.toString()));
  res.json({ user: toPublicUser(user) });
}

export async function demoLogin(_req: Request, res: Response): Promise<void> {
  if (!env.DEMO_ENABLED) {
    throw ApiError.forbidden('The demo account is switched off on this server.');
  }

  const user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    throw ApiError.notFound('The demo account has not been seeded yet. Run `npm run seed`.');
  }

  setAuthCookie(res, signToken(user._id.toString()));
  res.json({ user: toPublicUser(user) });
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(currentUserId(req));
  if (!user) throw ApiError.unauthorized();
  res.json({ user: toPublicUser(user) });
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  await Promise.all([
    Plan.deleteMany({ user: userId }),
    WaterLog.deleteMany({ user: userId }),
    WeightLog.deleteMany({ user: userId }),
  ]);
  await User.deleteOne({ _id: userId });
  clearAuthCookie(res);
  res.json({ ok: true });
}
