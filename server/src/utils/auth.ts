import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Response } from 'express';
import { COOKIE_MAX_AGE_MS, COOKIE_NAME, env, isProduction } from '../config/env.ts';

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// A real bcrypt hash of a random string, so accounts without a password (Google-only)
// take as long to reject as a wrong password does — timing reveals nothing.
const NO_PASSWORD_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

export async function verifyPassword(password: string, passwordHash: string | null): Promise<boolean> {
  const matches = await bcrypt.compare(password, passwordHash ?? NO_PASSWORD_HASH);
  return passwordHash !== null && matches;
}

/** A random, URL-safe secret (reset links, OAuth state). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** What is stored in place of a secret token: its SHA-256, hex-encoded. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): { sub: string; issuedAt: number } {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.iat !== 'number') {
    throw new jwt.JsonWebTokenError('Malformed token payload');
  }
  // `iat` is in whole seconds.
  return { sub: payload.sub, issuedAt: payload.iat };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  });
}
