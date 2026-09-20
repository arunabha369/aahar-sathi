import type { NextFunction, Request, Response } from 'express';
import { COOKIE_NAME } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/auth.js';

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
  const user = await User.findById(sub).select('_id').lean();
  if (!user) {
    next(ApiError.unauthorized('Your account could not be found. Please sign in again.'));
    return;
  }

  req.userId = user._id;
  next();
}

export function currentUserId(req: Request) {
  if (!req.userId) throw ApiError.unauthorized();
  return req.userId;
}
