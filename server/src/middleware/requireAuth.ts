import type { NextFunction, Request, Response } from 'express';
import { COOKIE_NAME } from '../config/env.ts';
import { findSessionUser } from '../db/users.ts';
import { ApiError } from '../utils/ApiError.ts';
import { verifyToken } from '../utils/auth.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Express is the real security boundary: every protected route verifies the JWT
 * and confirms the account still exists.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = (req.cookies as Record<string, string | undefined> | undefined)?.[COOKIE_NAME];
  if (!token) {
    next(ApiError.unauthorized());
    return;
  }

  const { sub, issuedAt } = verifyToken(token);
  // Sessions from before the move to Postgres carry an old-style id: treat them as signed out.
  const user = UUID.test(sub) ? await findSessionUser(sub) : null;
  if (!user) {
    next(ApiError.unauthorized('Your account could not be found. Please sign in again.'));
    return;
  }
  // A password change (e.g. a reset) ends every session issued before it. `iat` has whole-second
  // precision, so a session issued in the same second as the change still counts as newer.
  if (user.passwordChangedAt && issuedAt < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    next(ApiError.unauthorized('Your password was changed. Please sign in again.'));
    return;
  }

  req.userId = sub;
  next();
}

export function currentUserId(req: Request) {
  if (!req.userId) throw ApiError.unauthorized();
  return req.userId;
}
