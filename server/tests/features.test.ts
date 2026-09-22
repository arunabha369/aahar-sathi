import { beforeEach, describe, expect, it, vi } from 'vitest';

// Real push services are never called: web-push is replaced at the library boundary.
const sent: { endpoint: string; payload: string }[] = [];
let pushStatus = 201;
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(async (subscription: { endpoint: string }, payload: string) => {
      if (pushStatus >= 400) throw Object.assign(new Error('push failed'), { statusCode: pushStatus });
      sent.push({ endpoint: subscription.endpoint, payload });
      return { statusCode: pushStatus };
    }),
  },
}));

const { createApp } = await import('../src/app.ts');
const { pool } = await import('../src/db/pool.ts');
const { addDays } = await import('../src/services/almanac.ts');
const { suggestAdjustment, weightTrend } = await import('../src/services/adaptiveTargets.ts');
const { dueReminders, localTime, planTimeToMinutes } = await import('../src/services/reminders.ts');
const { DEFAULT_REMINDER_SETTINGS } = await import('../src/types.ts');
const { completeProfile, seedMeals, signUpWithProfile } = await import('./helpers.ts');

const app = createApp();

beforeEach(async () => {
  await seedMeals();
  sent.length = 0;
  pushStatus = 201;
});

const TODAY = '2026-03-02';
/** Weigh-ins every few days for three weeks, moving `kgPerWeek`. */
const weighIns = (startKg: number, kgPerWeek: number, today = TODAY) =>
  [20, 16, 12, 8, 4, 0].map((daysAgo) => ({
    date: addDays(today, -daysAgo),
    weightKg: Math.round((startKg + (kgPerWeek * (20 - daysAgo)) / 7) * 10) / 10,
  }));
const quiet = { calorieAdjustment: 0, calorieAdjustedAt: null, suggestionDismissedAt: null };

describe('adaptive targets', () => {
  it('measures the weight trend by least squares, and needs two weeks of weigh-ins', () => {
    expect(weightTrend(weighIns(80, -0.5), TODAY)!.kgPerWeek).toBeCloseTo(-0.5, 1);
    expect(weightTrend(weighIns(80, -0.5).slice(3), TODAY)).toBeNull(); // only 8 days covered
  });

  it('suggests 100 kcal less when weight loss has stalled, and 100 more when it is too fast', () => {
    const stalled = suggestAdjustment({ goal: 'loss', gender: 'male', calories: 2200, weights: weighIns(80, 0), today: TODAY, preferences: quiet });
    expect(stalled).toMatchObject({ status: 'suggest', change: -100 });
    expect(stalled.reason).toMatch(/barely moved in 3 weeks/);

    const fast = suggestAdjustment({ goal: 'loss', gender: 'male', calories: 2200, weights: weighIns(80, -1.2), today: TODAY, preferences: quiet });
    expect(fast).toMatchObject({ status: 'suggest', change: 100 });

    const onTrack = suggestAdjustment({ goal: 'loss', gender: 'male', calories: 2200, weights: weighIns(80, -0.5), today: TODAY, preferences: quiet });
    expect(onTrack).toMatchObject({ status: 'on-track', change: null });
  });

  it('handles gain and maintain goals the same way', () => {
    expect(suggestAdjustment({ goal: 'gain', gender: 'female', calories: 2100, weights: weighIns(55, 0), today: TODAY, preferences: quiet }).change).toBe(100);
    expect(suggestAdjustment({ goal: 'gain', gender: 'female', calories: 2100, weights: weighIns(55, 0.9), today: TODAY, preferences: quiet }).change).toBe(-100);
    expect(suggestAdjustment({ goal: 'maintain', gender: 'female', calories: 1900, weights: weighIns(60, 0.4), today: TODAY, preferences: quiet }).change).toBe(-100);
    expect(suggestAdjustment({ goal: 'maintain', gender: 'female', calories: 1900, weights: weighIns(60, 0.1), today: TODAY, preferences: quiet }).status).toBe('on-track');
  });

  it('never goes below the safe minimum or past ±500 kcal', () => {
    const floor = suggestAdjustment({ goal: 'loss', gender: 'female', calories: 1250, weights: weighIns(70, 0), today: TODAY, preferences: quiet });
    expect(floor).toMatchObject({ status: 'at-limit', change: null });
    expect(floor.reason).toMatch(/safe minimum/);

    const capped = suggestAdjustment({
      goal: 'loss',
      gender: 'male',
      calories: 2000,
      weights: weighIns(90, 0),
      today: TODAY,
      preferences: { ...quiet, calorieAdjustment: -500 },
    });
    expect(capped.status).toBe('at-limit');
  });

  it('stays quiet for two weeks after a change and a week after "not now"', () => {
    const adjusted = suggestAdjustment({
      goal: 'loss',
      gender: 'male',
      calories: 2200,
      weights: weighIns(80, 0),
      today: TODAY,
      preferences: { ...quiet, calorieAdjustment: -100, calorieAdjustedAt: `${addDays(TODAY, -10)}T08:00:00.000Z` },
    });
    expect(adjusted).toMatchObject({ status: 'recently-adjusted', quietUntil: addDays(TODAY, 4) });

    const dismissed = suggestAdjustment({
      goal: 'loss',
      gender: 'male',
      calories: 2200,
      weights: weighIns(80, 0),
      today: TODAY,
      preferences: { ...quiet, suggestionDismissedAt: `${addDays(TODAY, -3)}T08:00:00.000Z` },
    });
    expect(dismissed).toMatchObject({ status: 'dismissed', quietUntil: addDays(TODAY, 4) });
  });
});

describe('reminder scheduling', () => {
  const planDay = {
    day: 'Mon',
    totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    meals: [
      { slot: 'breakfast', time: '7:00 AM', name: 'Poha', label: undefined },
      { slot: 'lunch', time: '1:00 PM', name: 'Rajma chawal' },
    ],
  } as never;
  const context = (minutes: number, overrides = {}) => ({
    now: { date: TODAY, weekday: 'Mon' as const, minutes },
    settings: DEFAULT_REMINDER_SETTINGS,
    planDay,
    checkedIn: new Set<never>(),
    waterGlasses: 3,
    waterTarget: 10,
    weighedToday: false,
    ...overrides,
  });

  it('reads plan times and wall-clock time in the user’s timezone', () => {
    expect(planTimeToMinutes('7:00 AM')).toBe(420);
    expect(planTimeToMinutes('12:30 PM')).toBe(750);
    expect(planTimeToMinutes('12:05 AM')).toBe(5);
    expect(localTime(new Date('2026-03-02T01:30:00Z'), 'Asia/Kolkata')).toEqual({ date: '2026-03-02', weekday: 'Mon', minutes: 420 });
    expect(localTime(new Date('2026-03-02T01:30:00Z'), 'America/New_York').date).toBe('2026-03-01');
  });

  it('sends each reminder in the window after its time, and only while it still helps', () => {
    const at7 = dueReminders(context(7 * 60 + 5));
    expect(at7.map((reminder) => reminder.key)).toEqual([`${TODAY}:meal:breakfast`]);
    expect(at7[0]).toMatchObject({ title: 'Breakfast time', body: 'Poha' });
    // The weigh-in is at 07:30; breakfast's window has closed by 07:35.
    expect(dueReminders(context(7 * 60 + 35)).map((reminder) => reminder.key)).toEqual([`${TODAY}:weigh`]);

    // Water every two hours from 9:00.
    expect(dueReminders(context(11 * 60)).map((reminder) => reminder.key)).toContain(`${TODAY}:water:11:00`);
    expect(dueReminders(context(11 * 60 + 25)).map((reminder) => reminder.key)).not.toContain(`${TODAY}:water:11:00`);
    // No water nudges once the day's glasses are in; no meal nudge once it is checked in.
    expect(dueReminders(context(11 * 60, { waterGlasses: 10 }))).toEqual([]);
    expect(dueReminders(context(13 * 60)).map((reminder) => reminder.key)).toContain(`${TODAY}:meal:lunch`);
    expect(dueReminders(context(13 * 60, { checkedIn: new Set(['lunch']) })).map((reminder) => reminder.key)).not.toContain(
      `${TODAY}:meal:lunch`,
    );
    // Weigh-in only on the chosen day, and not after weighing.
    expect(dueReminders(context(7 * 60 + 35, { weighedToday: true })).map((reminder) => reminder.key)).toEqual([]);
    expect(dueReminders(context(7 * 60 + 35, { now: { date: TODAY, weekday: 'Tue', minutes: 7 * 60 + 35 } }))).toEqual([]);
  });

  it('adds the sehri and iftar times on Ramadan days', () => {
    const ramadan = {
      day: 'Mon',
      totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      kind: 'ramadan',
      fastTimes: { date: TODAY, sehriEnds: '05:21', iftar: '18:24' },
      meals: [
        { slot: 'breakfast', time: '4:40 AM', label: 'Sehri', name: 'Paneer paratha' },
        { slot: 'eveningSnack', time: '6:25 PM', label: 'Iftar', name: 'Dates with chana chaat' },
      ],
    } as never;
    const sehri = dueReminders(context(4 * 60 + 40, { planDay: ramadan }));
    expect(sehri[0]).toMatchObject({ title: 'Sehri time', body: 'Paneer paratha · Sehri ends at 5:21 AM' });
    const iftar = dueReminders(context(18 * 60 + 25, { planDay: ramadan }));
    expect(iftar[0]).toMatchObject({ title: 'Iftar time', body: 'Dates with chana chaat · Iftar at 6:24 PM' });
  });
});

describe('plan preferences API', () => {
  it('saves fasting and Jain preferences and plans with them', async () => {
    const { agent } = await signUpWithProfile(app, { ...completeProfile, diet: 'nonveg' });
    expect((await agent.get('/api/profile/preferences').expect(200)).body.preferences).toEqual({
      jain: false,
      fasting: 'none',
      vratDays: [],
      city: null,
    });

    const ramadanWithoutCity = await agent.put('/api/profile/preferences').send({ jain: false, fasting: 'ramadan', vratDays: [], city: null });
    expect(ramadanWithoutCity.status).toBe(400);
    expect(ramadanWithoutCity.body.error.message).toMatch(/city/);

    await agent
      .put('/api/profile/preferences')
      .send({ jain: false, fasting: 'none', vratDays: ['Thu', 'Mon', 'Mon'], city: 'pune' })
      .expect(200)
      .expect(({ body }) => expect(body.preferences.vratDays).toEqual(['Mon', 'Thu']));

    const plan = (await agent.post('/api/plans').expect(201)).body.plan;
    expect(plan.inputs.preferences).toMatchObject({ fasting: 'none', vratDays: ['Mon', 'Thu'], city: 'pune' });
    for (const day of plan.days) expect(day.kind ?? 'normal').toBe(['Mon', 'Thu'].includes(day.day) ? 'vrat' : 'normal');

    await agent.put('/api/profile/preferences').send({ jain: false, fasting: 'ramadan', vratDays: [], city: 'hyderabad' }).expect(200);
    const ramadan = (await agent.post('/api/plans').expect(201)).body.plan;
    for (const day of ramadan.days) {
      expect(day.kind).toBe('ramadan');
      expect(day.fastTimes.sehriEnds).toMatch(/^0[45]:\d\d$/);
      expect(day.fastTimes.iftar).toMatch(/^1[89]:\d\d$/);
    }

    // The diary's week counts each day's own number of planned meals.
    const today = new Date().toISOString().slice(0, 10);
    const summary = (await agent.get(`/api/diary/summary?to=${today}`).expect(200)).body;
    expect(summary.week.plannedMeals).toBe(7 * 3);
  });

  it('gives this week’s fasting calendar for the chosen city', async () => {
    const { agent } = await signUpWithProfile(app);
    const week = (await agent.get('/api/fasting/week?city=kolkata&today=2025-07-01').expect(200)).body;
    expect(week.city).toMatchObject({ key: 'kolkata', name: 'Kolkata', chosen: true });
    expect(week.ekadashi.map((day: { date: string }) => day.date)).toContain('2025-07-06');
    expect(week.ramadan).toHaveLength(7);
    expect((await agent.get('/api/fasting/cities').expect(200)).body.cities.length).toBeGreaterThan(30);
  });
});

describe('adaptive targets API', () => {
  it('suggests, applies with a new plan, and resets', async () => {
    const { agent } = await signUpWithProfile(app); // a loss goal
    const today = TODAY;
    for (const { date, weightKg } of weighIns(74, 0, today)) {
      await agent.put(`/api/logs/weight/${date}`).send({ weightKg }).expect(200);
    }
    const before = (await agent.get('/api/profile').expect(200)).body.targets.calories;

    const { suggestion } = (await agent.get(`/api/profile/adjustment?today=${today}`).expect(200)).body;
    expect(suggestion).toMatchObject({ status: 'suggest', change: -100, currentAdjustment: 0 });

    // A change that doesn't match the current suggestion is refused.
    await agent.post(`/api/profile/adjustment?today=${today}`).send({ change: 100 }).expect(409);

    const applied = (await agent.post(`/api/profile/adjustment?today=${today}`).send({ change: -100 }).expect(200)).body;
    expect(applied.calorieAdjustment).toBe(-100);
    expect(applied.targets.calories).toBe(before - 100);
    expect(applied.plan.isActive).toBe(true);
    expect(applied.plan.inputs.calorieAdjustment).toBe(-100);
    expect((await agent.get('/api/profile').expect(200)).body.targets.calories).toBe(before - 100);

    const quietNow = (await agent.get(`/api/profile/adjustment?today=${today}`).expect(200)).body.suggestion;
    expect(quietNow.status).toBe('recently-adjusted');

    const reset = (await agent.delete('/api/profile/adjustment').expect(200)).body;
    expect(reset.calorieAdjustment).toBe(0);
    expect(reset.targets.calories).toBe(before);
  });

  it('waits for enough weigh-ins', async () => {
    const { agent } = await signUpWithProfile(app);
    const { suggestion } = (await agent.get(`/api/profile/adjustment?today=${TODAY}`).expect(200)).body;
    expect(suggestion.status).toBe('not-enough-data');
    await agent.post('/api/profile/adjustment').send({ change: -100 }).expect(409);
  });
});

describe('household API', () => {
  const member = { name: 'Meera', age: 31, gender: 'female', weightKg: 58, heightCm: 158, activity: 'light', goal: 'maintain', diet: 'egg', jain: false };

  it('plans one menu for everyone, at the strictest diet, with each person’s portions', async () => {
    const { agent } = await signUpWithProfile(app, { ...completeProfile, diet: 'nonveg' });
    const added = (await agent.post('/api/household').send(member).expect(201)).body;
    expect(added.members).toHaveLength(1);
    expect(added.members[0].targets.calories).toBeGreaterThan(1200);
    expect(added.sharedDiet).toBe('egg');

    const plan = (await agent.post('/api/plans').expect(201)).body.plan;
    expect(plan.inputs.diet).toBe('egg');
    expect(plan.inputs.household).toEqual([
      { id: added.members[0].id, name: 'Meera', calories: added.members[0].targets.calories },
    ]);
    for (const meal of plan.days.flatMap((day: { meals: unknown[] }) => day.meals) as {
      diet: string;
      portions: { name: string; kcal: number }[];
    }[]) {
      expect(meal.diet).not.toBe('nonveg');
      expect(meal.portions).toHaveLength(1);
      expect(meal.portions[0]!.name).toBe('Meera');
    }

    // Two people's shopping: the list says so, and a swap keeps the portions.
    const grocery = (await agent.get(`/api/plans/${plan.id}/grocery`).expect(200)).body;
    expect(grocery.servings).toBe(2);
    const swapped = (await agent.post(`/api/plans/${plan.id}/swap`).send({ dayIndex: 0, slot: 'lunch' }).expect(200)).body.plan;
    expect(swapped.days[0].meals.find((meal: { slot: string }) => meal.slot === 'lunch').portions).toHaveLength(1);

    const edited = (await agent.put(`/api/household/${added.members[0].id}`).send({ ...member, diet: 'veg', jain: true }).expect(200)).body;
    expect(edited).toMatchObject({ sharedDiet: 'veg', anyJain: true });
    const jainPlan = (await agent.post('/api/plans').expect(201)).body.plan;
    expect(jainPlan.inputs.preferences.jain).toBe(true);

    await agent.delete(`/api/household/${added.members[0].id}`).expect(200);
    await agent.delete(`/api/household/${added.members[0].id}`).expect(404);
  });

  it('refuses members under 18 and caps the household at eight', async () => {
    const { agent } = await signUpWithProfile(app);
    await agent.post('/api/household').send({ ...member, age: 12 }).expect(400);
    for (let index = 0; index < 8; index += 1) await agent.post('/api/household').send({ ...member, name: `P${index}` }).expect(201);
    await agent.post('/api/household').send(member).expect(400);
  });

  it('keeps members private to their household', async () => {
    const owner = await signUpWithProfile(app);
    const other = await signUpWithProfile(app);
    const { members } = (await owner.agent.post('/api/household').send(member).expect(201)).body;
    await other.agent.put(`/api/household/${members[0].id}`).send(member).expect(404);
    await other.agent.delete(`/api/household/${members[0].id}`).expect(404);
    expect((await other.agent.get('/api/household').expect(200)).body.members).toEqual([]);
  });
});

describe('grocery, pantry and prep API', () => {
  it('lists amounts, remembers what is at home across plans, and plans the prep', async () => {
    const { agent } = await signUpWithProfile(app);
    const plan = (await agent.post('/api/plans').expect(201)).body.plan;
    const list = (await agent.get(`/api/plans/${plan.id}/grocery`).expect(200)).body;
    const items = list.groups.flatMap((group: { items: { name: string; amount: string | null }[] }) => group.items);
    expect(items.filter((item: { amount: string | null }) => item.amount).length).toBeGreaterThan(items.length * 0.8);
    expect(list.atHome).toEqual([]);

    await agent.put('/api/pantry').send({ item: 'Salt', atHome: true }).expect(200);
    await agent.put('/api/pantry').send({ item: 'Salt', atHome: true }).expect(200);
    expect((await agent.get('/api/pantry').expect(200)).body.items).toEqual(['Salt']);

    const next = (await agent.post('/api/plans').expect(201)).body.plan;
    expect((await agent.get(`/api/plans/${next.id}/grocery`).expect(200)).body.atHome).toEqual(['Salt']);
    await agent.put('/api/pantry').send({ item: 'Salt', atHome: false }).expect(200);
    expect((await agent.get('/api/pantry').expect(200)).body.items).toEqual([]);

    const prep = (await agent.get(`/api/plans/${next.id}/prep`).expect(200)).body;
    expect(prep.sessions.length).toBeGreaterThan(0);
    expect(prep.sessions[0].tasks[0]).toEqual(
      expect.objectContaining({ title: expect.any(String), how: expect.any(String), amounts: expect.any(Array) }),
    );
  });
});

describe('recipes API', () => {
  it('lists every dish and serves a full recipe', async () => {
    const { agent } = await signUpWithProfile(app);
    const { recipes } = (await agent.get('/api/recipes').expect(200)).body;
    expect(recipes.length).toBeGreaterThanOrEqual(100);

    const { recipe } = (await agent.get('/api/recipes/rajma-chawal').expect(200)).body;
    expect(recipe).toMatchObject({ slug: 'rajma-chawal', name: expect.any(String), tags: expect.arrayContaining(['jain']) });
    expect(recipe.steps.length).toBeGreaterThan(2);
    expect(recipe.ingredients.find((ingredient: { key: string }) => ingredient.key === 'rajma')).toMatchObject({ qty: 45, unit: 'g' });
    expect(recipe.jainNotes.length).toBeGreaterThan(0);

    await agent.get('/api/recipes/not-a-dish').expect(404);
    await agent.get('/api/recipes/Bad%20Slug').expect(400);
  });

  it('needs a signed-in user', async () => {
    const request = (await import('supertest')).default;
    await request(app).get('/api/recipes').expect(401);
  });
});

describe('reminders API', () => {
  const subscription = { endpoint: 'https://push.example.com/send/abc123', keys: { p256dh: 'BPk3y', auth: 'a9th' } };
  const settings = { timezone: 'Asia/Kolkata', ...DEFAULT_REMINDER_SETTINGS };

  it('saves settings and devices, and sends a test', async () => {
    const { agent } = await signUpWithProfile(app);
    const initial = (await agent.get('/api/reminders/settings').expect(200)).body;
    expect(initial).toMatchObject({ available: true, publicKey: 'BExamplePublicKeyForTestsOnly', devices: 0, timezone: null });

    await agent.put('/api/reminders/settings').send({ ...settings, timezone: 'Mars/Olympus' }).expect(400);
    await agent.put('/api/reminders/settings').send({ ...settings, water: { ...settings.water, from: '21:00', to: '09:00' } }).expect(400);
    await agent.put('/api/reminders/settings').send(settings).expect(200);

    await agent.post('/api/reminders/test').expect(400); // no device yet
    await agent.post('/api/reminders/subscriptions').send(subscription).expect(201);
    await agent.post('/api/reminders/subscriptions').send(subscription).expect(201);
    expect((await agent.get('/api/reminders/settings').expect(200)).body).toMatchObject({ devices: 1, timezone: 'Asia/Kolkata' });

    await agent.post('/api/reminders/test').expect(200);
    expect(sent).toHaveLength(1);
    expect(JSON.parse(sent[0]!.payload)).toMatchObject({ title: 'Reminders are on', url: '/settings' });

    await agent.delete('/api/reminders/subscriptions').send({ endpoint: subscription.endpoint }).expect(200);
    expect((await agent.get('/api/reminders/settings').expect(200)).body.devices).toBe(0);
  });

  it('runs on the scheduler’s secret only, sends each reminder once, and forgets dead devices', async () => {
    const { agent } = await signUpWithProfile(app);
    await agent.post('/api/plans').expect(201);
    // Water every hour all day, so something is always due.
    await agent
      .put('/api/reminders/settings')
      .send({ ...settings, timezone: 'UTC', water: { enabled: true, everyMinutes: 60, from: '00:00', to: '23:59' } })
      .expect(200);
    await agent.post('/api/reminders/subscriptions').send(subscription).expect(201);

    const request = (await import('supertest')).default;
    await request(app).post('/api/reminders/run').expect(401);
    await request(app).post('/api/reminders/run').set('Authorization', 'Bearer wrong').expect(401);

    const auth = `Bearer ${process.env.CRON_SECRET}`;
    await request(app).post('/api/reminders/run').set('Authorization', auth).expect(200);

    // With the clock fixed at 10:05 UTC, the 10:00 water nudge is due: sent once, never twice.
    const { runReminders } = await import('../src/services/reminders.ts');
    await pool.query('delete from app.reminder_log');
    sent.length = 0;
    const at = new Date('2026-03-02T10:05:00Z');
    expect(await runReminders(at)).toEqual({ users: 1, sent: 1 });
    expect(JSON.parse(sent[0]!.payload)).toMatchObject({ title: 'Time for a glass of water', tag: 'water', url: '/dashboard' });
    expect(await runReminders(at)).toEqual({ users: 1, sent: 0 });
    // Twenty-five minutes late is too late to be useful.
    await pool.query('delete from app.reminder_log');
    expect((await runReminders(new Date('2026-03-02T10:25:00Z'))).sent).toBe(0);

    // A device the push service reports gone is removed on the next attempt.
    await pool.query('delete from app.reminder_log');
    pushStatus = 410;
    expect((await runReminders(at)).sent).toBe(0);
    expect((await agent.get('/api/reminders/settings').expect(200)).body.devices).toBe(0);
  });
});
