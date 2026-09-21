import { env } from './config/env.js';
import { MEALS } from './data/meals.js';
import { deleteLogsForUser, insertLogs, type WaterEntry, type WeightEntry } from './db/logs.js';
import { syncMeals } from './db/meals.js';
import { deletePlansForUser, setGroceryChecked } from './db/plans.js';
import { checkDatabase, closeDatabase } from './db/pool.js';
import { upsertUserByEmail } from './db/users.js';
import { calculateTargets } from './services/nutrition.js';
import { createPlanForUser } from './services/planService.js';
import { hashPassword } from './utils/auth.js';
import { addDays, toDateKey } from './utils/date.js';
import { createRandom } from './utils/random.js';
import type { Profile } from './types.js';

const DEMO_EMAIL = 'demo@aaharsathi.in';
const DEMO_PASSWORD = 'Demo@1234';
const DEMO_PROFILE: Profile = {
  age: 29,
  gender: 'male',
  weightKg: 74,
  heightCm: 175,
  activity: 'moderate',
  goal: 'loss',
  diet: 'veg',
  cuisine: 'north',
};
const LOG_DAYS = 30;

/** Upserts by slug, so running the seed again refreshes data without duplicating it. */
async function seedMeals(): Promise<void> {
  const { added, updated, removed } = await syncMeals(MEALS);
  console.log(`🍲 Meals: ${added} added, ${updated} updated, ${removed} removed (${MEALS.length} total)`);
}

async function seedDemoUser(): Promise<void> {
  if (!env.DEMO_ENABLED) {
    console.log('👤 DEMO_ENABLED is false — skipping the demo account.');
    return;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await upsertUserByEmail({
    name: 'Demo User',
    email: DEMO_EMAIL,
    passwordHash,
    profile: DEMO_PROFILE,
  });

  // Rebuild the demo data from scratch every time so the charts always look right.
  await deletePlansForUser(user.id);
  await deleteLogsForUser(user.id);

  const plan = await createPlanForUser({
    userId: user.id,
    profile: DEMO_PROFILE,
    random: createRandom(20240501),
  });

  // Mark a handful of staples as already bought so the grocery counter is not at zero.
  const firstGroup = plan.days[0]?.meals.flatMap((meal) => meal.ingredients.map((i) => i.name)) ?? [];
  await setGroceryChecked(plan.id, user.id, [...new Set(firstGroup)].slice(0, 5));

  const targets = calculateTargets(DEMO_PROFILE);
  const random = createRandom(31337);
  const today = new Date();

  const weightLogs: WeightEntry[] = [];
  const waterLogs: WaterEntry[] = [];
  for (let offset = LOG_DAYS - 1; offset >= 0; offset -= 1) {
    const date = toDateKey(addDays(today, -offset));
    // A gentle downward trend with day-to-day noise, the way real weight moves.
    const trend = DEMO_PROFILE.weightKg + (offset / LOG_DAYS) * 2.6;
    const weightKg = Math.round((trend + (random() - 0.5) * 0.6) * 10) / 10;
    weightLogs.push({ date, weightKg });

    const glasses = Math.max(3, Math.min(targets.waterGlasses, targets.waterGlasses - Math.floor(random() * 4)));
    waterLogs.push({ date, glasses });
  }

  await insertLogs(user.id, waterLogs, weightLogs);

  console.log(`👤 Demo user ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`📋 Active plan: ${plan.targets.calories} kcal, ${plan.days.length} days`);
  console.log(`📈 Logs: ${weightLogs.length} weight entries, ${waterLogs.length} water entries`);
}

async function seed(): Promise<void> {
  await checkDatabase();
  console.log('✅ Connected to Postgres');
  await seedMeals();
  await seedDemoUser();
  await closeDatabase();
  console.log('🌱 Seed complete');
}

seed().catch(async (error: unknown) => {
  console.error('❌ Seed failed:', error);
  await closeDatabase().catch(() => undefined);
  process.exit(1);
});
