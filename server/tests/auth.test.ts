import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';
import { pool } from '../src/db/pool.ts';
import { upsertUserByEmail } from '../src/db/users.ts';
import { hashPassword } from '../src/utils/auth.ts';
import { DEMO_EMAIL } from '../src/controllers/authController.ts';
import { completeProfile } from './helpers.ts';

const app = createApp();

const credentials = { name: 'Asha Verma', email: 'Asha@Example.com', password: 'Str0ngPass!' };

function tokenFrom(response: request.Response): string {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((cookie) => cookie.startsWith('token=')) ?? '';
}

describe('POST /api/auth/register', () => {
  it('creates an account, sets an httpOnly cookie and never returns the password hash', async () => {
    const response = await request(app).post('/api/auth/register').send(credentials).expect(201);

    expect(response.body.user).toMatchObject({
      name: 'Asha Verma',
      email: 'asha@example.com',
      profileComplete: false,
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const cookie = tokenFrom(response);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, password: 'short7!' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(credentials).expect(201);
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'asha@example.com' })
      .expect(409);

    expect(response.body.error.code).toBe('CONFLICT');
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with the right password', async () => {
    await request(app).post('/api/auth/register').send(credentials).expect(201);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@example.com', password: credentials.password })
      .expect(200);

    expect(response.body.user.email).toBe('asha@example.com');
    expect(tokenFrom(response)).toContain('token=');
  });

  it('rejects a wrong password with 401', async () => {
    await request(app).post('/api/auth/register').send(credentials).expect(201);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@example.com', password: 'WrongPass123' })
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a cookie', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('returns the signed-in user and stops working after logout', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials).expect(201);

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.email).toBe('asha@example.com');

    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/auth/me').expect(401);
  });

  it('rejects a tampered token', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['token=not-a-real-jwt'])
      .expect(401);
  });
});

describe('POST /api/auth/demo', () => {
  it('signs in the seeded demo user', async () => {
    await upsertUserByEmail({
      name: 'Demo User',
      email: DEMO_EMAIL,
      passwordHash: await hashPassword('Demo@1234'),
      profile: completeProfile,
    });

    const response = await request(app).post('/api/auth/demo').expect(200);
    expect(response.body.user.email).toBe(DEMO_EMAIL);
  });

  it('returns 404 when the demo user has not been seeded', async () => {
    await request(app).post('/api/auth/demo').expect(404);
  });
});

describe('DELETE /api/account', () => {
  it('removes the account and signs the user out', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials).expect(201);
    await agent.delete('/api/account').expect(200);

    const { rows } = await pool.query<{ users: number; plans: number }>(
      'select (select count(*)::int from app.users) as users, (select count(*)::int from app.plans) as plans',
    );
    expect(rows[0]).toEqual({ users: 0, plans: 0 });
    await agent.get('/api/auth/me').expect(401);
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const response = await request(app).get('/api/nope').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('malformed request bodies', () => {
  it('answers broken JSON with a 400, not a server error', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(response.body.error.message).toBe('The request body is not valid JSON.');
  });
});
