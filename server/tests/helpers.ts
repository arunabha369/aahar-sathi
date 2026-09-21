import request from 'supertest';
import type { Express } from 'express';
import { MEALS } from '../src/data/meals.ts';
import { syncMeals } from '../src/db/meals.ts';
import type { Profile } from '../src/types.ts';

export const completeProfile: Profile = {
  age: 28,
  gender: 'male',
  weightKg: 74,
  heightCm: 176,
  activity: 'moderate',
  goal: 'loss',
  diet: 'veg',
  cuisine: 'north',
};

export async function seedMeals(): Promise<void> {
  await syncMeals(MEALS);
}

let counter = 0;

/** Registers a fresh user and returns an agent that keeps the auth cookie. */
export async function signUp(app: Express, overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  counter += 1;
  const credentials = {
    name: overrides.name ?? `Test User ${counter}`,
    email: overrides.email ?? `user${counter}@example.com`,
    password: overrides.password ?? 'Str0ngPass!',
  };
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(credentials).expect(201);
  return { agent, credentials };
}

export async function signUpWithProfile(app: Express, profile: Profile = completeProfile) {
  const { agent, credentials } = await signUp(app);
  await agent.put('/api/profile').send(profile).expect(200);
  return { agent, credentials };
}
