import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { signToken } from '../src/utils/auth.js';
import { seedMeals, signUpWithProfile } from './helpers.js';

const app = createApp();

async function count(table: string): Promise<number> {
  const { rows } = await pool.query<{ n: number }>(`select count(*)::int as n from app.${table}`);
  return rows[0]!.n;
}

describe('Postgres guarantees', () => {
  it('removes a deleted account’s plans and logs along with it', async () => {
    await seedMeals();
    const { agent } = await signUpWithProfile(app);
    await agent.post('/api/plans').expect(201);
    await agent.put('/api/logs/water/2026-09-01').send({ glasses: 6 }).expect(200);
    await agent.put('/api/logs/weight/2026-09-01').send({ weightKg: 72.4 }).expect(200);

    await agent.delete('/api/account').expect(200);

    expect([await count('users'), await count('plans'), await count('water_logs'), await count('weight_logs')]).toEqual([
      0, 0, 0, 0,
    ]);
  });

  it('keeps exactly one active plan when two are generated at the same moment', async () => {
    await seedMeals();
    const { agent } = await signUpWithProfile(app);

    const responses = await Promise.all([agent.post('/api/plans'), agent.post('/api/plans'), agent.post('/api/plans')]);
    expect(responses.map((response) => response.status)).toEqual([201, 201, 201]);

    const { rows } = await pool.query<{ active: number; total: number }>(
      'select count(*) filter (where is_active)::int as active, count(*)::int as total from app.plans',
    );
    expect(rows[0]).toEqual({ active: 1, total: 3 });
  });

  it('returns weight and dates exactly as they were saved', async () => {
    const { agent } = await signUpWithProfile(app);
    await agent.put('/api/logs/weight/2026-01-31').send({ weightKg: 71.3 }).expect(200);

    const response = await agent.get('/api/logs/weight?from=2026-01-01&to=2026-02-28').expect(200);
    expect(response.body.logs).toEqual([{ date: '2026-01-31', weightKg: 71.3 }]);
  });

  it('treats a session cookie from the MongoDB days as signed out, not as a server error', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${signToken('64f1c2a9b8e4d3c2a1f0e9d8')}`])
      .expect(401);
  });
});
