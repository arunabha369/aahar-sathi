import type { Request, Response } from 'express';
import { waitUntil } from '@vercel/functions';
import { appUrl } from '../config/env.ts';
import { consumePasswordReset, createPasswordReset, resetSentRecently } from '../db/passwordResets.ts';
import { findUserByEmail, findUserById } from '../db/users.ts';
import { validBody } from '../middleware/validate.ts';
import { passwordResetEmail, sendEmail } from '../services/email.ts';
import { ApiError } from '../utils/ApiError.ts';
import { hashPassword, hashToken, randomToken, setAuthCookie, signToken } from '../utils/auth.ts';
import { toPublicUser } from '../utils/serialize.ts';
import type { ForgotPasswordBody, ResetPasswordBody } from '../validation/schemas.ts';

const RESET_MINUTES = 30;
/** At most one reset email per account per minute, so an address cannot be flooded. */
const RESEND_AFTER_SECONDS = 60;

async function sendResetLink(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user || (await resetSentRecently(user.id, RESEND_AFTER_SECONDS))) return;

  const token = randomToken();
  await createPasswordReset(user.id, hashToken(token), new Date(Date.now() + RESET_MINUTES * 60_000));
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({ to: user.email, ...passwordResetEmail({ name: user.name, link, minutes: RESET_MINUTES }) });
}

/**
 * Always answers the same way, straight away, whether or not the email has an account:
 * the work (and its timing) happens after the response, so neither the reply nor how long
 * it takes reveals who is registered.
 */
export function forgotPassword(req: Request, res: Response): void {
  const { email } = validBody<ForgotPasswordBody>(req);

  const work = sendResetLink(email).catch((error: unknown) => {
    console.error('[password-reset] could not send a reset link:', error);
  });
  // On Vercel, keeps the function alive until the email is sent; elsewhere the promise just runs.
  waitUntil(work);

  res.json({ ok: true });
}

/** Sets a new password from a reset link, ends every other session, and signs this one in. */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = validBody<ResetPasswordBody>(req);

  const userId = await consumePasswordReset(hashToken(token), await hashPassword(password));
  if (!userId) {
    throw ApiError.badRequest('This reset link has expired or has already been used. Ask for a new one.');
  }

  const user = await findUserById(userId);
  if (!user) throw ApiError.badRequest('This reset link has expired or has already been used. Ask for a new one.');

  setAuthCookie(res, signToken(user.id));
  res.json({ user: toPublicUser(user) });
}
