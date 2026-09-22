import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { appUrl, env, googleSignInEnabled, isProduction } from '../config/env.ts';
import { createGoogleUser, findUserByEmail, findUserByGoogleSub, linkGoogleAccount, type UserRecord } from '../db/users.ts';
import { randomToken, setAuthCookie, signToken } from '../utils/auth.ts';

/**
 * "Continue with Google" — OpenID Connect's authorization-code flow with PKCE, talking to
 * Google's endpoints directly. The only thing kept between the two legs is a short-lived,
 * httpOnly cookie holding the state, the PKCE verifier and where to go afterwards.
 */
const STATE_COOKIE = 'google_oauth';
const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

const callbackUrl = () => `${appUrl()}/api/auth/google/callback`;

/** Only same-site paths: never let `next` send someone to another website. */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value;
}

const cookieOptions = {
  httpOnly: true,
  // Lax, because Google sends the user back with a top-level GET from its own site.
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/api/auth/google',
};

function failTo(res: Response, reason: string): void {
  res.clearCookie(STATE_COOKIE, cookieOptions);
  res.redirect(303, `/login?error=${encodeURIComponent(reason)}`);
}

/** Step 1: send the browser to Google's sign-in page. */
export function googleStart(req: Request, res: Response): void {
  if (!googleSignInEnabled) {
    res.redirect(303, '/login?error=google_unavailable');
    return;
  }

  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const next = safeNextPath(req.query.next);

  res.cookie(STATE_COOKIE, JSON.stringify({ state, verifier, next }), { ...cookieOptions, maxAge: STATE_MAX_AGE_MS });

  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  res.redirect(303, url.toString());
}

interface GoogleProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

async function fetchGoogleProfile(code: string, verifier: string): Promise<GoogleProfile | null> {
  const tokenResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: callbackUrl(),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });
  if (!tokenResponse.ok) return null;
  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!accessToken) return null;

  // The access token came straight from Google over TLS in exchange for our client secret,
  // so the profile it unlocks is trustworthy without verifying an ID-token signature here.
  const profileResponse = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!profileResponse.ok) return null;
  const profile = (await profileResponse.json()) as GoogleProfile;
  return typeof profile.sub === 'string' ? profile : null;
}

/**
 * Finds the account for this Google identity, linking or creating one as needed. Returns
 * null when the email belongs to an account already linked to a different Google account.
 */
async function accountFor(profile: GoogleProfile & { email: string }, retry = true): Promise<UserRecord | null> {
  const bySub = await findUserByGoogleSub(profile.sub);
  if (bySub) return bySub;

  // Google has verified this address, so it is safe to connect it to the account that uses it.
  const byEmail = await findUserByEmail(profile.email);
  if (byEmail) return linkGoogleAccount(byEmail.id, profile.sub);

  const name = (profile.name?.trim() || profile.email.split('@')[0] || 'Friend').slice(0, 60);
  try {
    return await createGoogleUser({ name, email: profile.email, googleSub: profile.sub });
  } catch (error) {
    // Two callbacks racing (a double click): the other one created it first — look again.
    if (retry && (error as { code?: string }).code === '23505') return accountFor(profile, false);
    throw error;
  }
}

/** Step 2: Google sends the browser back here with a one-time code. */
export async function googleCallback(req: Request, res: Response): Promise<void> {
  if (!googleSignInEnabled) {
    failTo(res, 'google_unavailable');
    return;
  }

  let saved: { state?: unknown; verifier?: unknown; next?: unknown } = {};
  try {
    saved = JSON.parse(String((req.cookies as Record<string, string | undefined>)[STATE_COOKIE] ?? '{}')) as typeof saved;
  } catch {
    saved = {};
  }

  const { code, state, error } = req.query;
  if (error === 'access_denied') {
    failTo(res, 'google_cancelled');
    return;
  }
  if (typeof code !== 'string' || typeof state !== 'string' || typeof saved.verifier !== 'string' || state !== saved.state) {
    failTo(res, 'google_failed');
    return;
  }

  const profile = await fetchGoogleProfile(code, saved.verifier);
  if (!profile) {
    failTo(res, 'google_failed');
    return;
  }
  if (!profile.email || profile.email_verified !== true) {
    failTo(res, 'google_unverified');
    return;
  }

  const user = await accountFor({ ...profile, email: profile.email });
  if (!user) {
    failTo(res, 'google_conflict');
    return;
  }
  res.clearCookie(STATE_COOKIE, cookieOptions);
  setAuthCookie(res, signToken(user.id));
  res.redirect(303, user.profileComplete ? (safeNextPath(saved.next) ?? '/dashboard') : '/onboarding');
}
