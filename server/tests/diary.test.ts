import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.ts';
import { addDays, toDateKey } from '../src/utils/date.ts';
import { seedMeals, signUp, signUpWithProfile } from './helpers.ts';

const app = createApp();
const today = toDateKey(new Date());
const daysAgo = (n: number) => toDateKey(addDays(new Date(`${today}T00:00:00`), -n));

beforeEach(async () => {
  await seedMeals();
});
afterEach(() => {
  vi.restoreAllMocks();
});

async function userWithPlan() {
  const user = await signUpWithProfile(app);
  await user.agent.post('/api/plans').expect(201);
  const day = (await user.agent.get(`/api/diary/${today}`).expect(200)).body;
  return { ...user, day };
}

describe('the day’s planned meals', () => {
  it('lists today’s five planned meals, with nothing eaten yet', async () => {
    const { day } = await userWithPlan();
    expect(day.planned).toHaveLength(5);
    expect(day.planned.every((meal: { status: unknown }) => meal.status === null)).toBe(true);
    expect(day.eaten).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
    expect(day.targets.calories).toBeGreaterThan(1000);
  });

  it('counts a meal once it is marked eaten, not when skipped, and can be undone', async () => {
    const { agent, day } = await userWithPlan();
    const [breakfast, snack] = day.planned;

    let result = (await agent.put(`/api/diary/${today}/checkins/${breakfast.slot}`).send({ status: 'eaten' }).expect(200)).body;
    expect(result.eaten.kcal).toBe(breakfast.kcal);
    expect(result.planned[0].status).toBe('eaten');

    result = (await agent.put(`/api/diary/${today}/checkins/${snack.slot}`).send({ status: 'skipped' }).expect(200)).body;
    expect(result.eaten.kcal).toBe(breakfast.kcal);

    result = (await agent.delete(`/api/diary/${today}/checkins/${breakfast.slot}`).expect(200)).body;
    expect(result.eaten.kcal).toBe(0);
    expect(result.planned[0].status).toBeNull();
  });

  it('keeps what was eaten even after the plan is reshuffled', async () => {
    const { agent, day } = await userWithPlan();
    const lunch = day.planned.find((meal: { slot: string }) => meal.slot === 'lunch');
    await agent.put(`/api/diary/${today}/checkins/lunch`).send({ status: 'eaten' }).expect(200);

    const plan = (await agent.get('/api/plans/active').expect(200)).body.plan;
    await agent.post(`/api/plans/${plan.id}/shuffle`).expect(200);

    const after = (await agent.get(`/api/diary/${today}`).expect(200)).body;
    expect(after.checkins.find((checkin: { slot: string }) => checkin.slot === 'lunch')).toMatchObject({
      mealName: lunch.name,
      kcal: lunch.kcal,
    });
    expect(after.eaten.kcal).toBe(lunch.kcal);
  });

  it('refuses a check-in with no plan, or for a day that hasn’t happened', async () => {
    const { agent } = await signUpWithProfile(app);
    await agent.put(`/api/diary/${today}/checkins/lunch`).send({ status: 'eaten' }).expect(400);
    const { agent: planned } = await userWithPlan();
    const nextWeek = toDateKey(addDays(new Date(`${today}T00:00:00`), 7));
    await planned.put(`/api/diary/${nextWeek}/checkins/lunch`).send({ status: 'eaten' }).expect(400);
    await planned.put(`/api/diary/${today}/checkins/brunch`).send({ status: 'eaten' }).expect(400);
    await planned.put(`/api/diary/${today}/checkins/lunch`).send({ status: 'swapped' }).expect(400);
  });
});

describe('logging other food', () => {
  it('logs a dish from the meal list by the serving', async () => {
    const { agent } = await userWithPlan();
    const { meals } = (await agent.get('/api/foods/search?q=idli').expect(200)).body;
    expect(meals.length).toBeGreaterThan(0);
    const dish = meals[0];

    const result = (await agent.post(`/api/diary/${today}/entries`).send({ source: 'meal', ref: dish.slug, servings: 1.5 }).expect(201)).body;
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ name: dish.name, servings: 1.5, kcal: Math.round(dish.kcal * 1.5) });
    expect(result.eaten.kcal).toBe(Math.round(dish.kcal * 1.5));
  });

  it('saves your own dish, finds it in search, logs it and keeps it private', async () => {
    const { agent } = await userWithPlan();
    const { food } = (
      await agent
        .post('/api/foods/custom')
        .send({ name: 'Maa’s rajma', servingLabel: '1 bowl', kcal: 320, protein: 14, carbs: 44, fat: 9 })
        .expect(201)
    ).body;

    const search = (await agent.get('/api/foods/search?q=rajma').expect(200)).body;
    expect(search.custom.map((item: { id: string }) => item.id)).toEqual([food.id]);

    const result = (await agent.post(`/api/diary/${today}/entries`).send({ source: 'custom', ref: food.id, servings: 2 }).expect(201)).body;
    expect(result.eaten).toEqual({ kcal: 640, protein: 28, carbs: 88, fat: 18 });

    const stranger = await signUp(app);
    const theirs = (await stranger.agent.get('/api/foods/search?q=rajma').expect(200)).body;
    expect(theirs.custom).toEqual([]);
    await stranger.agent.post(`/api/diary/${today}/entries`).send({ source: 'custom', ref: food.id, servings: 1 }).expect(400);

    await agent
      .post('/api/foods/custom')
      .send({ name: 'maa’s RAJMA', servingLabel: '1 bowl', kcal: 1, protein: 0, carbs: 0, fat: 0 })
      .expect(409);
  });

  it('logs a packaged product from its label numbers', async () => {
    const { agent } = await userWithPlan();
    const result = (
      await agent
        .post(`/api/diary/${today}/entries`)
        .send({ source: 'barcode', ref: '8901058851298', name: 'Maggi 2-minutes Noodles', servingLabel: '70 g', kcal: 306, protein: 7.3, carbs: 31.2, fat: 11, servings: 1 })
        .expect(201)
    ).body;
    expect(result.entries[0]).toMatchObject({ source: 'barcode', ref: '8901058851298', kcal: 306, fat: 11 });
  });

  it('treats a food logged in place of a planned meal as a swap, and reopens the meal if it is removed', async () => {
    const { agent } = await userWithPlan();
    const { meals } = (await agent.get('/api/foods/search?q=poha').expect(200)).body;

    let result = (await agent.post(`/api/diary/${today}/entries`).send({ source: 'meal', ref: meals[0].slug, servings: 1, slot: 'breakfast' }).expect(201)).body;
    expect(result.planned.find((meal: { slot: string }) => meal.slot === 'breakfast').status).toBe('swapped');
    // Only what was really eaten counts — not the planned breakfast too.
    expect(result.eaten.kcal).toBe(meals[0].kcal);

    result = (await agent.delete(`/api/diary/${today}/entries/${result.entries[0].id}`).expect(200)).body;
    expect(result.planned.find((meal: { slot: string }) => meal.slot === 'breakfast').status).toBeNull();
    expect(result.eaten.kcal).toBe(0);
  });

  it('keeps entries private and validates them', async () => {
    const { agent } = await userWithPlan();
    const { meals } = (await agent.get('/api/foods/search?q=dal').expect(200)).body;
    const result = (await agent.post(`/api/diary/${today}/entries`).send({ source: 'meal', ref: meals[0].slug, servings: 1 }).expect(201)).body;

    const stranger = await signUp(app);
    await stranger.agent.delete(`/api/diary/${today}/entries/${result.entries[0].id}`).expect(404);

    await agent.post(`/api/diary/${today}/entries`).send({ source: 'meal', ref: meals[0].slug, servings: 0 }).expect(400);
    await agent.post(`/api/diary/${today}/entries`).send({ source: 'meal', ref: meals[0].slug, servings: 25 }).expect(400);
    await agent.post(`/api/diary/${today}/entries`).send({ source: 'meal', ref: 'no-such-dish', servings: 1 }).expect(400);
    await agent.post(`/api/diary/${today}/entries`).send({ source: 'barcode', ref: '123', name: 'x', servingLabel: '1', kcal: 1, protein: 0, carbs: 0, fat: 0, servings: 1 }).expect(400);
  });

  it('searches safely with characters that mean something to SQL', async () => {
    const { agent } = await userWithPlan();
    const result = (await agent.get(`/api/foods/search?q=${encodeURIComponent('%_\\')}`).expect(200)).body;
    expect(result.meals).toEqual([]);
  });
});

describe('barcode lookup', () => {
  it('returns the product from Open Food Facts, and a clear 404 when it is unknown', async () => {
    const { agent } = await userWithPlan();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/product/8901058851298')) {
        return Response.json({
          status: 1,
          product: {
            product_name: 'Maggi 2-minutes Noodles',
            brands: 'Maggi, Nestlé',
            serving_size: '70 g',
            serving_quantity: 70,
            nutriments: { 'energy-kcal_100g': 437, proteins_100g: 10.4, carbohydrates_100g: 44.5, fat_100g: 15.7 },
          },
        });
      }
      return Response.json({ status: 0 }, { status: 404 });
    });

    const found = (await agent.get('/api/foods/barcode/8901058851298').expect(200)).body.product;
    expect(found).toMatchObject({ name: 'Maggi 2-minutes Noodles', brand: 'Maggi', servingLabel: '70 g' });
    expect(found.per100).toEqual({ kcal: 437, protein: 10.4, carbs: 44.5, fat: 15.7 });
    expect(found.perServing).toEqual({ kcal: 306, protein: 7.3, carbs: 31.2, fat: 11 });

    await agent.get('/api/foods/barcode/0000000000000').expect(404);
    await agent.get('/api/foods/barcode/12ab').expect(400);
  });

  it('says so when the product database is down', async () => {
    const { agent } = await userWithPlan();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('busy', { status: 503 }));
    const response = await agent.get('/api/foods/barcode/8901719110023').expect(502);
    expect(response.body.error.code).toBe('UPSTREAM_ERROR');
  });
});

describe('streak and weekly adherence', () => {
  it('counts consecutive logged days and scores the week', async () => {
    const { agent, day } = await userWithPlan();
    // Three days in a row, ending yesterday: today not logged yet still keeps the streak.
    for (const date of [daysAgo(3), daysAgo(2), daysAgo(1)]) {
      await agent.put(`/api/diary/${date}/checkins/lunch`).send({ status: 'eaten' }).expect(200);
    }
    // A gap before that must not count.
    await agent.put(`/api/diary/${daysAgo(5)}/checkins/lunch`).send({ status: 'eaten' }).expect(200);

    let summary = (await agent.get(`/api/diary/summary?to=${today}`).expect(200)).body;
    expect(summary.streak).toBe(3);
    expect(summary.days).toHaveLength(7);
    expect(summary.week).toMatchObject({ plannedMeals: 35, eatenAsPlanned: 4, trackedDays: 0 });

    // A fully tracked day today, eaten exactly as planned, lands on target.
    for (const meal of day.planned) {
      await agent.put(`/api/diary/${today}/checkins/${meal.slot}`).send({ status: 'eaten' }).expect(200);
    }
    summary = (await agent.get(`/api/diary/summary?to=${today}`).expect(200)).body;
    expect(summary.streak).toBe(4);
    expect(summary.week.trackedDays).toBe(1);
    expect(summary.week.onTargetDays).toBe(1);
    expect(summary.days.at(-1).kcal).toBe(day.planned.reduce((sum: number, meal: { kcal: number }) => sum + meal.kcal, 0));
  });

  it('covers up to 90 days and refuses more', async () => {
    const { agent } = await userWithPlan();
    expect((await agent.get(`/api/diary/summary?to=${today}&days=90`).expect(200)).body.days).toHaveLength(90);
    await agent.get(`/api/diary/summary?to=${today}&days=400`).expect(400);
  });
});

describe('diary routes need a signed-in user', () => {
  it('401s without a session', async () => {
    await request(app).get(`/api/diary/${today}`).expect(401);
    await request(app).get('/api/foods/search?q=dal').expect(401);
    await request(app).get('/api/foods/barcode/8901058851298').expect(401);
  });
});
