import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.ts';
import { pool } from '../src/db/pool.ts';
import { devOutbox } from '../src/services/email.ts';
import { signUp } from './helpers.ts';

const app = createApp();

/** The reset email is sent after the response, so wait for it to land. */
async function resetLinkFor(email: string): Promise<string> {
  await vi.waitFor(() => expect(devOutbox.some((sent) => sent.to === email)).toBe(true));
  const sent = devOutbox.find((message) => message.to === email)!;
  const link = sent.text.match(/http:\/\/localhost:3000\/reset-password\?token=\S+/)?.[0];
  expect(link).toBeDefined();
  return new URL(link!).searchParams.get('token')!;
}

describe('forgot password', () => {
  it('answers the same way for an unknown email and sends nothing', async () => {
    const response = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' }).expect(200);
    expect(response.body).toEqual({ ok: true });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(devOutbox).toHaveLength(0);
  });

  it('emails a one-time link and stores only a hash of it', async () => {
    const { credentials } = await signUp(app);
    const response = await request(app).post('/api/auth/forgot-password').send({ email: credentials.email }).expect(200);
    expect(response.body).toEqual({ ok: true });

    const token = await resetLinkFor(credentials.email);
    expect(token.length).toBeGreaterThanOrEqual(40);
    const { rows } = await pool.query<{ token_hash: string }>('select token_hash from app.password_resets');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.token_hash).not.toBe(token);
    expect(rows[0]!.token_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('sends at most one email a minute to the same account', async () => {
    const { credentials } = await signUp(app);
    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email }).expect(200);
    await resetLinkFor(credentials.email);
    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email }).expect(200);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(devOutbox.filter((sent) => sent.to === credentials.email)).toHaveLength(1);
  });
});

describe('reset password', () => {
  it('sets the new password, signs this device in and ends every older session', async () => {
    const { agent: oldSession, credentials } = await signUp(app);
    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email }).expect(200);
    const token = await resetLinkFor(credentials.email);

    // Sessions have whole-second precision; step past the second the old one was issued in.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const fresh = request.agent(app);
    const response = await fresh.post('/api/auth/reset-password').send({ token, password: 'N3wPassword!' }).expect(200);
    expect(response.body.user.email).toBe(credentials.email.toLowerCase());
    await fresh.get('/api/auth/me').expect(200);

    const signedOut = await oldSession.get('/api/auth/me').expect(401);
    expect(signedOut.body.error.message).toContain('password was changed');

    await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password }).expect(401);
    await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'N3wPassword!' }).expect(200);
  });

  it('refuses a link that was already used', async () => {
    const { credentials } = await signUp(app);
    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email }).expect(200);
    const token = await resetLinkFor(credentials.email);

    await request(app).post('/api/auth/reset-password').send({ token, password: 'N3wPassword!' }).expect(200);
    const reused = await request(app).post('/api/auth/reset-password').send({ token, password: 'An0therPass!' }).expect(400);
    expect(reused.body.error.message).toContain('expired or has already been used');
  });

  it('refuses a link that has expired', async () => {
    const { credentials } = await signUp(app);
    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email }).expect(200);
    const token = await resetLinkFor(credentials.email);

    await pool.query("update app.password_resets set expires_at = now() - interval '1 second'");
    await request(app).post('/api/auth/reset-password').send({ token, password: 'N3wPassword!' }).expect(400);
    // …and the old password still works.
    await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password }).expect(200);
  });

  it('refuses a link that never existed', async () => {
    await request(app).post('/api/auth/reset-password').send({ token: 'x'.repeat(43), password: 'N3wPassword!' }).expect(400);
  });

  it('validates the new password like sign-up does', async () => {
    await request(app).post('/api/auth/reset-password').send({ token: 'x'.repeat(43), password: 'short' }).expect(400);
  });
});
