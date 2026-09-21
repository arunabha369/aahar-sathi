import type { Request, Response } from 'express';
import { env } from '../config/env.ts';
import { createUser, deleteUser, findUserByEmail, findUserById, findUserWithPasswordByEmail } from '../db/users.ts';
import { ApiError } from '../utils/ApiError.ts';
import { clearAuthCookie, hashPassword, setAuthCookie, signToken, verifyPassword } from '../utils/auth.ts';
import { toPublicUser } from '../utils/serialize.ts';
import { validBody } from '../middleware/validate.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import type { LoginBody, RegisterBody } from '../validation/schemas.ts';

export const DEMO_EMAIL = 'demo@aaharsathi.in';

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = validBody<RegisterBody>(req);

  if (await findUserByEmail(email)) {
    throw ApiError.conflict('An account with this email already exists. Try signing in instead.');
  }

  // A race between two sign-ups with one email still ends in a 409: the unique index catches it.
  const user = await createUser({ name, email, passwordHash: await hashPassword(password) });

  setAuthCookie(res, signToken(user.id));
  res.status(201).json({ user: toPublicUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = validBody<LoginBody>(req);

  const user = await findUserWithPasswordByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw ApiError.unauthorized('That email and password do not match.');
  }

  setAuthCookie(res, signToken(user.id));
  res.json({ user: toPublicUser(user) });
}

export async function demoLogin(_req: Request, res: Response): Promise<void> {
  if (!env.DEMO_ENABLED) {
    throw ApiError.forbidden('The demo account is switched off on this server.');
  }

  const user = await findUserByEmail(DEMO_EMAIL);
  if (!user) {
    throw ApiError.notFound('The demo account has not been seeded yet. Run `npm run seed`.');
  }

  setAuthCookie(res, signToken(user.id));
  res.json({ user: toPublicUser(user) });
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await findUserById(currentUserId(req));
  if (!user) throw ApiError.unauthorized();
  res.json({ user: toPublicUser(user) });
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  // Plans and logs are removed by the database's ON DELETE CASCADE.
  await deleteUser(currentUserId(req));
  clearAuthCookie(res);
  res.json({ ok: true });
}
