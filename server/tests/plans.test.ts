import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { completeProfile, seedMeals, signUp, signUpWithProfile } from './helpers.js';

const app = createApp();

beforeEach(async () => {
  await seedMeals();
});

describe('PUT /api/profile', () => {
  it('saves a valid profile, marks it complete and returns targets', async () => {
    const { agent } = await signUp(app);

    const response = await agent.put('/api/profile').send(completeProfile).expect(200);

    expect(response.body.user.profileComplete).toBe(true);
    expect(response.body.profile).toMatchObject(completeProfile);
    // 74 kg at 176 cm is a BMI of 23.9 — 'Overweight' under the Asian-Indian cut-offs.
    expect(response.body.targets).toMatchObject({ bmi: 23.9, bmiCategory: 'Overweight' });
    expect(response.body.targets.calories).toBeGreaterThan(1500);
  });

  it('rejects an age below 18 with a field-level message', async () => {
    const { agent } = await signUp(app);

    const response = await agent.put('/api/profile').send({ ...completeProfile, age: 17 }).expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details[0].field).toBe('age');
  });

  it('rejects an out-of-range weight', async () => {
    const { agent } = await signUp(app);
    await agent.put('/api/profile').send({ ...completeProfile, weightKg: 260 }).expect(400);
  });

  it('needs a signed-in user', async () => {
    await request(app).put('/api/profile').send(completeProfile).expect(401);
  });
});

describe('POST /api/plans', () => {
  it('refuses to generate a plan before the profile is complete', async () => {
    const { agent } = await signUp(app);
    const response = await agent.post('/api/plans').expect(400);
    expect(response.body.error.message).toContain('profile');
  });

  it('generates a 7-day plan from the saved profile and makes it active', async () => {
    const { agent } = await signUpWithProfile(app);

    const response = await agent.post('/api/plans').expect(201);
    const { plan } = response.body;

    expect(plan.isActive).toBe(true);
    expect(plan.days).toHaveLength(7);
    expect(plan.days[0].meals).toHaveLength(5);
    expect(plan.inputs).toMatchObject(completeProfile);
    expect(plan.targets.calories).toBeGreaterThan(1200);
    for (const day of plan.days) {
      const drift = Math.abs(day.totals.kcal - plan.targets.calories) / plan.targets.calories;
      expect(drift).toBeLessThanOrEqual(0.1);
      for (const meal of day.meals) expect(meal.diet).toBe('veg');
    }
  });

  it('leaves only the newest plan active', async () => {
    const { agent } = await signUpWithProfile(app);
    const first = (await agent.post('/api/plans').expect(201)).body.plan;
    const second = (await agent.post('/api/plans').expect(201)).body.plan;

    const active = (await agent.get('/api/plans/active').expect(200)).body.plan;
    expect(active.id).toBe(second.id);

    const older = (await agent.get(`/api/plans/${first.id}`).expect(200)).body.plan;
    expect(older.isActive).toBe(false);
  });
});

describe('GET /api/plans', () => {
  it('returns null when there is no active plan yet', async () => {
    const { agent } = await signUpWithProfile(app);
    const response = await agent.get('/api/plans/active').expect(200);
    expect(response.body.plan).toBeNull();
  });

  it('paginates the history, newest first', async () => {
    const { agent } = await signUpWithProfile(app);
    for (let index = 0; index < 3; index += 1) {
      await agent.post('/api/plans').expect(201);
    }

    const page1 = await agent.get('/api/plans?page=1&limit=2').expect(200);
    expect(page1.body.plans).toHaveLength(2);
    expect(page1.body.total).toBe(3);
    expect(page1.body.totalPages).toBe(2);
    expect(page1.body.plans[0].isActive).toBe(true);
    expect(page1.body.plans[0]).toHaveProperty('calories');

    const page2 = await agent.get('/api/plans?page=2&limit=2').expect(200);
    expect(page2.body.plans).toHaveLength(1);
  });

  it('rejects a silly page size', async () => {
    const { agent } = await signUpWithProfile(app);
    await agent.get('/api/plans?limit=500').expect(400);
  });
});

describe('plan ownership', () => {
  it('hides one user’s plan from another', async () => {
    const owner = await signUpWithProfile(app);
    const planId = (await owner.agent.post('/api/plans').expect(201)).body.plan.id;

    const stranger = await signUpWithProfile(app);
    await stranger.agent.get(`/api/plans/${planId}`).expect(404);
    await stranger.agent.post(`/api/plans/${planId}/activate`).expect(404);
    await stranger.agent.delete(`/api/plans/${planId}`).expect(404);
    await stranger.agent
      .post(`/api/plans/${planId}/swap`)
      .send({ dayIndex: 0, slot: 'lunch' })
      .expect(404);
  });

  it('rejects an id that is not an ObjectId', async () => {
    const { agent } = await signUpWithProfile(app);
    await agent.get('/api/plans/not-an-id').expect(400);
  });
});

describe('POST /api/plans/:id/activate and DELETE /api/plans/:id', () => {
  it('brings an older plan back and promotes a survivor when the active plan is deleted', async () => {
    const { agent } = await signUpWithProfile(app);
    const first = (await agent.post('/api/plans').expect(201)).body.plan;
    const second = (await agent.post('/api/plans').expect(201)).body.plan;

    const reactivated = (await agent.post(`/api/plans/${first.id}/activate`).expect(200)).body.plan;
    expect(reactivated.isActive).toBe(true);
    expect((await agent.get('/api/plans/active').expect(200)).body.plan.id).toBe(first.id);

    await agent.delete(`/api/plans/${first.id}`).expect(200);
    expect((await agent.get('/api/plans/active').expect(200)).body.plan.id).toBe(second.id);
  });
});

describe('POST /api/plans/:id/swap', () => {
  it('swaps a single meal and keeps the day total on target', async () => {
    const { agent } = await signUpWithProfile(app);
    const plan = (await agent.post('/api/plans').expect(201)).body.plan;
    const before = plan.days[1].meals.find((meal: { slot: string }) => meal.slot === 'dinner');

    const response = await agent
      .post(`/api/plans/${plan.id}/swap`)
      .send({ dayIndex: 1, slot: 'dinner' })
      .expect(200);

    const after = response.body.plan.days[1].meals.find((meal: { slot: string }) => meal.slot === 'dinner');
    expect(after.slug).not.toBe(before.slug);
    expect(after.slot).toBe('dinner');

    const day = response.body.plan.days[1];
    const drift = Math.abs(day.totals.kcal - plan.targets.calories) / plan.targets.calories;
    expect(drift).toBeLessThanOrEqual(0.15);
    expect(response.body.plan.days[0]).toEqual(plan.days[0]);
  });

  it('validates the day index and slot', async () => {
    const { agent } = await signUpWithProfile(app);
    const plan = (await agent.post('/api/plans').expect(201)).body.plan;

    await agent.post(`/api/plans/${plan.id}/swap`).send({ dayIndex: 9, slot: 'lunch' }).expect(400);
    await agent.post(`/api/plans/${plan.id}/swap`).send({ dayIndex: 0, slot: 'brunch' }).expect(400);
  });
});

describe('POST /api/plans/:id/shuffle', () => {
  it('rebuilds the week against the same targets', async () => {
    const { agent } = await signUpWithProfile(app);
    const plan = (await agent.post('/api/plans').expect(201)).body.plan;

    const response = await agent.post(`/api/plans/${plan.id}/shuffle`).expect(200);
    const shuffled = response.body.plan;

    expect(shuffled.targets).toEqual(plan.targets);
    expect(shuffled.days).toHaveLength(7);
    expect(JSON.stringify(shuffled.days)).not.toBe(JSON.stringify(plan.days));
    for (const day of shuffled.days) {
      const drift = Math.abs(day.totals.kcal - plan.targets.calories) / plan.targets.calories;
      expect(drift).toBeLessThanOrEqual(0.1);
    }
  });
});

describe('grocery list', () => {
  it('groups ingredients by category and remembers what has been bought', async () => {
    const { agent } = await signUpWithProfile(app);
    const plan = (await agent.post('/api/plans').expect(201)).body.plan;

    const list = (await agent.get(`/api/plans/${plan.id}/grocery`).expect(200)).body;
    expect(list.total).toBeGreaterThan(20);
    expect(list.checked).toEqual([]);
    expect(list.groups.some((group: { category: string }) => group.category === 'Spices & Others')).toBe(true);

    const firstItem = list.groups[0].items[0];
    const checked = (
      await agent.patch(`/api/plans/${plan.id}/grocery`).send({ item: firstItem, checked: true }).expect(200)
    ).body;
    expect(checked.checked).toEqual([firstItem]);

    // Ticking twice must not duplicate the entry.
    const again = (
      await agent.patch(`/api/plans/${plan.id}/grocery`).send({ item: firstItem, checked: true }).expect(200)
    ).body;
    expect(again.checked).toEqual([firstItem]);

    const unchecked = (
      await agent.patch(`/api/plans/${plan.id}/grocery`).send({ item: firstItem, checked: false }).expect(200)
    ).body;
    expect(unchecked.checked).toEqual([]);
  });

  it('refuses an ingredient that is not on the list', async () => {
    const { agent } = await signUpWithProfile(app);
    const plan = (await agent.post('/api/plans').expect(201)).body.plan;

    await agent
      .patch(`/api/plans/${plan.id}/grocery`)
      .send({ item: 'Truffle oil', checked: true })
      .expect(400);
  });
});

describe('diet rules through the API', () => {
  it('gives an eggetarian at least one egg dish a day and a non-vegetarian meat at lunch or dinner', async () => {
    const eggUser = await signUpWithProfile(app, { ...completeProfile, diet: 'egg' });
    const eggPlan = (await eggUser.agent.post('/api/plans').expect(201)).body.plan;
    for (const day of eggPlan.days) {
      expect(day.meals.some((meal: { diet: string }) => meal.diet === 'egg')).toBe(true);
      expect(day.meals.every((meal: { diet: string }) => meal.diet !== 'nonveg')).toBe(true);
    }

    const nonVegUser = await signUpWithProfile(app, { ...completeProfile, diet: 'nonveg' });
    const nonVegPlan = (await nonVegUser.agent.post('/api/plans').expect(201)).body.plan;
    for (const day of nonVegPlan.days) {
      const hasMeat = day.meals.some(
        (meal: { diet: string; slot: string }) =>
          meal.diet === 'nonveg' && (meal.slot === 'lunch' || meal.slot === 'dinner'),
      );
      expect(hasMeat).toBe(true);
    }
  });
});

describe('authentication on plan routes', () => {
  it('needs a signed-in user everywhere', async () => {
    await request(app).get('/api/plans').expect(401);
    await request(app).get('/api/plans/active').expect(401);
    await request(app).post('/api/plans').expect(401);
  });
});
