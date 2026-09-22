import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.ts';
import { pool } from '../src/db/pool.ts';
import { safeNextPath } from '../src/controllers/googleController.ts';
import { completeProfile, signUp } from './helpers.ts';

const app = createApp();

afterEach(() => {
  vi.restoreAllMocks();
});

interface FakeGoogle {
  sub?: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  tokenOk?: boolean;
}

/** Stands in for Google's token and userinfo endpoints; records what was sent to them. */
function fakeGoogle({ sub = 'google-123', email = 'meera@example.com', emailVerified = true, name = 'Meera Iyer', tokenOk = true }: FakeGoogle = {}) {
  const calls: { url: string; body?: string; authorization?: string }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ url, body: init?.body?.toString(), authorization: headers.get('authorization') ?? undefined });
    if (url === 'https://oauth2.googleapis.com/token') {
      return tokenOk
        ? Response.json({ access_token: 'access-abc', id_token: 'ignored', token_type: 'Bearer' })
        : Response.json({ error: 'invalid_grant' }, { status: 400 });
    }
    if (url === 'https://openidconnect.googleapis.com/v1/userinfo') {
      return Response.json({ sub, email, email_verified: emailVerified, name });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  });
  return calls;
}

/** Step 1 through the app, then step 2 as Google would send the browser back. */
async function signInWithGoogle(options: { next?: string; tamperState?: boolean } = {}) {
  const agent = request.agent(app);
  const start = await agent.get(`/api/auth/google${options.next ? `?next=${encodeURIComponent(options.next)}` : ''}`).expect(303);
  const authorize = new URL(start.headers.location!);
  const state = authorize.searchParams.get('state')!;
  const callback = await agent
    .get(`/api/auth/google/callback?code=one-time-code&state=${options.tamperState ? 'forged' : state}`)
    .expect(303);
  return { agent, authorize, callback };
}

describe('Continue with Google', () => {
  it('sends the browser to Google with state and PKCE', async () => {
    const response = await request(app).get('/api/auth/google').expect(303);
    const url = new URL(response.headers.location!);
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('test-client-id.apps.googleusercontent.com');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/google/callback');
    expect(url.searchParams.get('scope')).toBe('openid email profile');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')!.length).toBeGreaterThanOrEqual(40);
    const cookie = response.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toContain('google_oauth=');
    expect(cookie).toContain('HttpOnly');
  });

  it('creates an account for a new Google user and sends them to onboarding', async () => {
    const calls = fakeGoogle();
    const { agent, callback } = await signInWithGoogle();
    expect(callback.headers.location).toBe('/onboarding');

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user).toMatchObject({ email: 'meera@example.com', name: 'Meera Iyer', profileComplete: false });

    // The code was exchanged with the client secret and the PKCE verifier.
    const token = new URLSearchParams(calls[0]!.body);
    expect(token.get('code')).toBe('one-time-code');
    expect(token.get('client_secret')).toBe('test-client-secret');
    expect(token.get('code_verifier')!.length).toBeGreaterThanOrEqual(43);
    expect(calls[1]!.authorization).toBe('Bearer access-abc');

    const { rows } = await pool.query('select password_hash, google_sub from app.users');
    expect(rows).toEqual([{ password_hash: null, google_sub: 'google-123' }]);
  });

  it('links to an existing account with the same email instead of making a second one', async () => {
    const { agent: existing, credentials } = await signUp(app, { email: 'meera@example.com' });
    await existing.put('/api/profile').send(completeProfile).expect(200);

    fakeGoogle({ email: 'Meera@Example.com' });
    const { agent, callback } = await signInWithGoogle({ next: '/progress' });
    expect(callback.headers.location).toBe('/progress');
    expect((await agent.get('/api/auth/me').expect(200)).body.user.email).toBe('meera@example.com');

    const { rows } = await pool.query<{ n: number }>('select count(*)::int as n from app.users');
    expect(rows[0]!.n).toBe(1);
    // The password still works too.
    await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password }).expect(200);
  });

  it('signs a returning Google user back in', async () => {
    fakeGoogle();
    await signInWithGoogle();
    vi.restoreAllMocks();
    fakeGoogle();
    const { callback } = await signInWithGoogle();
    expect(callback.headers.location).toBe('/onboarding');
    const { rows } = await pool.query<{ n: number }>('select count(*)::int as n from app.users');
    expect(rows[0]!.n).toBe(1);
  });

  it('rejects a forged state, a failed code exchange and an unverified email', async () => {
    fakeGoogle();
    expect((await signInWithGoogle({ tamperState: true })).callback.headers.location).toBe('/login?error=google_failed');
    vi.restoreAllMocks();

    fakeGoogle({ tokenOk: false });
    expect((await signInWithGoogle()).callback.headers.location).toBe('/login?error=google_failed');
    vi.restoreAllMocks();

    fakeGoogle({ emailVerified: false });
    expect((await signInWithGoogle()).callback.headers.location).toBe('/login?error=google_unverified');

    const { rows } = await pool.query<{ n: number }>('select count(*)::int as n from app.users');
    expect(rows[0]!.n).toBe(0);
  });

  it('refuses to relink an account already tied to a different Google account', async () => {
    fakeGoogle({ sub: 'google-first' });
    await signInWithGoogle();
    vi.restoreAllMocks();
    fakeGoogle({ sub: 'google-second' });
    expect((await signInWithGoogle()).callback.headers.location).toBe('/login?error=google_conflict');
  });

  it('explains how to sign in when a Google-only account tries a password', async () => {
    fakeGoogle();
    await signInWithGoogle();
    const response = await request(app).post('/api/auth/login').send({ email: 'meera@example.com', password: 'Anything1!' }).expect(401);
    expect(response.body.error.message).toContain('Continue with Google');
  });

  it('only returns to paths on this site', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard');
    expect(safeNextPath('https://evil.example')).toBeNull();
    expect(safeNextPath('//evil.example')).toBeNull();
    expect(safeNextPath('/\\evil.example')).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
  });
});
