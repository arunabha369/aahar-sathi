import type { NextFunction, Request, Response } from 'express';
import { COOKIE_NAME } from '../config/env.js';
import { userExists } from '../db/users.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/auth.js';

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

  const { sub } = verifyToken(token);
  // Sessions from before the move to Postgres carry an old-style id: treat them as signed out.
  if (!UUID.test(sub) || !(await userExists(sub))) {
    next(ApiError.unauthorized('Your account could not be found. Please sign in again.'));
    return;
  }

  req.userId = sub;
  next();
}

export function currentUserId(req: Request) {
  if (!req.userId) throw ApiError.unauthorized();
  return req.userId;
}
