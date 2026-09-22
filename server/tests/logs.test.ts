import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';
import { signUp } from './helpers.ts';

const app = createApp();

describe('water logs', () => {
  it('stores one entry per day and overwrites it on the next save', async () => {
    const { agent } = await signUp(app);

    const first = await agent.put('/api/logs/water/2026-03-10').send({ glasses: 4 }).expect(200);
    expect(first.body.log).toEqual({ date: '2026-03-10', glasses: 4 });

    const second = await agent.put('/api/logs/water/2026-03-10').send({ glasses: 7 }).expect(200);
    expect(second.body.log.glasses).toBe(7);

    const list = await agent.get('/api/logs/water?from=2026-03-01&to=2026-03-31').expect(200);
    expect(list.body.logs).toEqual([{ date: '2026-03-10', glasses: 7 }]);
  });

  it('returns the range sorted by date', async () => {
    const { agent } = await signUp(app);
    for (const [date, glasses] of [['2026-03-12', 6], ['2026-03-10', 3], ['2026-03-11', 8]] as const) {
      await agent.put(`/api/logs/water/${date}`).send({ glasses }).expect(200);
    }

    const list = await agent.get('/api/logs/water?from=2026-03-10&to=2026-03-11').expect(200);
    expect(list.body.logs.map((log: { date: string }) => log.date)).toEqual(['2026-03-10', '2026-03-11']);
  });

  it('rejects a bad date, a bad count and a backwards range', async () => {
    const { agent } = await signUp(app);
    await agent.put('/api/logs/water/10-03-2026').send({ glasses: 4 }).expect(400);
    await agent.put('/api/logs/water/2026-03-10').send({ glasses: -1 }).expect(400);
    await agent.put('/api/logs/water/2026-03-10').send({ glasses: 2.5 }).expect(400);
    await agent.get('/api/logs/water?from=2026-03-20&to=2026-03-10').expect(400);
  });

  it('keeps one user’s logs away from another', async () => {
    const first = await signUp(app);
    await first.agent.put('/api/logs/water/2026-03-10').send({ glasses: 5 }).expect(200);

    const second = await signUp(app);
    const list = await second.agent.get('/api/logs/water?from=2026-03-01&to=2026-03-31').expect(200);
    expect(list.body.logs).toEqual([]);
  });
});

describe('weight logs', () => {
  it('saves, updates and deletes a day’s weight', async () => {
    const { agent } = await signUp(app);

    await agent.put('/api/logs/weight/2026-03-10').send({ weightKg: 74.5 }).expect(200);
    const updated = await agent.put('/api/logs/weight/2026-03-10').send({ weightKg: 74.1 }).expect(200);
    expect(updated.body.log).toEqual({ date: '2026-03-10', weightKg: 74.1 });

    await agent.delete('/api/logs/weight/2026-03-10').expect(200);
    const list = await agent.get('/api/logs/weight?from=2026-03-01&to=2026-03-31').expect(200);
    expect(list.body.logs).toEqual([]);
  });

  it('404s when deleting a day that was never logged', async () => {
    const { agent } = await signUp(app);
    await agent.delete('/api/logs/weight/2026-03-10').expect(404);
  });

  it('rejects weights outside the supported range', async () => {
    const { agent } = await signUp(app);
    await agent.put('/api/logs/weight/2026-03-10').send({ weightKg: 12 }).expect(400);
    await agent.put('/api/logs/weight/2026-03-10').send({ weightKg: 400 }).expect(400);
  });

  it('defaults to the last 90 days when no range is given', async () => {
    const { agent } = await signUp(app);
    const today = new Date();
    const key = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;

    await agent.put(`/api/logs/weight/${key}`).send({ weightKg: 70 }).expect(200);
    const list = await agent.get('/api/logs/weight').expect(200);

    expect(list.body.logs).toEqual([{ date: key, weightKg: 70 }]);
    expect(list.body.to).toBe(key);
  });
});

describe('sleep logs', () => {
  it('works out the hours across midnight and dates the night by the morning', async () => {
    const { agent } = await signUp(app);

    const response = await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '23:30', wakeTime: '06:45' }).expect(200);
    expect(response.body.log).toEqual({ date: '2026-03-10', bedtime: '23:30', wakeTime: '06:45', durationMinutes: 435 });

    // Going to bed after midnight is the same night, just shorter.
    const late = await agent.put('/api/logs/sleep/2026-03-11').send({ bedtime: '00:15', wakeTime: '07:00' }).expect(200);
    expect(late.body.log.durationMinutes).toBe(405);
  });

  it('keeps one night per morning, lists in date order and deletes', async () => {
    const { agent } = await signUp(app);
    await agent.put('/api/logs/sleep/2026-03-12').send({ bedtime: '22:00', wakeTime: '06:00' }).expect(200);
    await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '23:00', wakeTime: '07:00' }).expect(200);
    await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '22:45', wakeTime: '06:15' }).expect(200);

    const list = await agent.get('/api/logs/sleep?from=2026-03-01&to=2026-03-31').expect(200);
    expect(list.body.logs).toEqual([
      { date: '2026-03-10', bedtime: '22:45', wakeTime: '06:15', durationMinutes: 450 },
      { date: '2026-03-12', bedtime: '22:00', wakeTime: '06:00', durationMinutes: 480 },
    ]);

    await agent.delete('/api/logs/sleep/2026-03-12').expect(200);
    await agent.delete('/api/logs/sleep/2026-03-12').expect(404);
  });

  it('rejects times that are not a night of sleep, with a readable message', async () => {
    const { agent } = await signUp(app);
    const tooShort = await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '23:00', wakeTime: '23:30' }).expect(400);
    expect(JSON.stringify(tooShort.body)).toContain('between 1 and 16 hours');
    await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '06:00', wakeTime: '23:00' }).expect(400); // 17 hours
    await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '07:00', wakeTime: '07:00' }).expect(400);
    await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '25:00', wakeTime: '07:00' }).expect(400);
    await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '11pm', wakeTime: '07:00' }).expect(400);
    await agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '23:00' }).expect(400);
  });

  it('keeps one user’s sleep away from another', async () => {
    const asha = await signUp(app);
    const ravi = await signUp(app);
    await asha.agent.put('/api/logs/sleep/2026-03-10').send({ bedtime: '23:00', wakeTime: '07:00' }).expect(200);

    const list = await ravi.agent.get('/api/logs/sleep?from=2026-03-01&to=2026-03-31').expect(200);
    expect(list.body.logs).toEqual([]);
    await ravi.agent.delete('/api/logs/sleep/2026-03-10').expect(404);
  });
});

describe('authentication on log routes', () => {
  it('needs a signed-in user', async () => {
    await request(app).get('/api/logs/water').expect(401);
    await request(app).put('/api/logs/weight/2026-03-10').send({ weightKg: 70 }).expect(401);
    await request(app).get('/api/logs/sleep').expect(401);
    await request(app).put('/api/logs/sleep/2026-03-10').send({ bedtime: '23:00', wakeTime: '07:00' }).expect(401);
  });
});
