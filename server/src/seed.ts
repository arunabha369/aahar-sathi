import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { MEALS } from './data/meals.js';
import { Meal } from './models/Meal.js';
import { Plan } from './models/Plan.js';
import { User } from './models/User.js';
import { WaterLog } from './models/WaterLog.js';
import { WeightLog } from './models/WeightLog.js';
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
  const operations = MEALS.map((meal) => ({
    updateOne: {
      filter: { slug: meal.slug },
      update: { $set: meal },
      upsert: true,
    },
  }));

  const result = await Meal.bulkWrite(operations);
  const removed = await Meal.deleteMany({ slug: { $nin: MEALS.map((meal) => meal.slug) } });

  console.log(
    `🍲 Meals: ${result.upsertedCount} added, ${result.modifiedCount} updated, ${removed.deletedCount} removed (${MEALS.length} total)`,
  );
}

async function seedDemoUser(): Promise<void> {
  if (!env.DEMO_ENABLED) {
    console.log('👤 DEMO_ENABLED is false — skipping the demo account.');
    return;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    { $set: { name: 'Demo User', passwordHash, profile: DEMO_PROFILE, profileComplete: true } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );

  // Rebuild the demo data from scratch every time so the charts always look right.
  await Promise.all([
    Plan.deleteMany({ user: user._id }),
    WaterLog.deleteMany({ user: user._id }),
    WeightLog.deleteMany({ user: user._id }),
  ]);

  const plan = await createPlanForUser({
    userId: user._id,
    profile: DEMO_PROFILE,
    random: createRandom(20240501),
  });

  // Mark a handful of staples as already bought so the grocery counter is not at zero.
  const firstGroup = plan.days[0]?.meals.flatMap((meal) => meal.ingredients.map((i) => i.name)) ?? [];
  plan.groceryChecked = [...new Set(firstGroup)].slice(0, 5);
  await plan.save();

  const targets = calculateTargets(DEMO_PROFILE);
  const random = createRandom(31337);
  const today = new Date();

  const weightLogs = [];
  const waterLogs = [];
  for (let offset = LOG_DAYS - 1; offset >= 0; offset -= 1) {
    const date = toDateKey(addDays(today, -offset));
    // A gentle downward trend with day-to-day noise, the way real weight moves.
    const trend = DEMO_PROFILE.weightKg + (offset / LOG_DAYS) * 2.6;
    const weightKg = Math.round((trend + (random() - 0.5) * 0.6) * 10) / 10;
    weightLogs.push({ user: user._id, date, weightKg });

    const glasses = Math.max(3, Math.min(targets.waterGlasses, targets.waterGlasses - Math.floor(random() * 4)));
    waterLogs.push({ user: user._id, date, glasses });
  }

  await WeightLog.insertMany(weightLogs);
  await WaterLog.insertMany(waterLogs);

  console.log(`👤 Demo user ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`📋 Active plan: ${plan.targets.calories} kcal, ${plan.days.length} days`);
  console.log(`📈 Logs: ${weightLogs.length} weight entries, ${waterLogs.length} water entries`);
}

async function seed(): Promise<void> {
  await connectDb(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  await seedMeals();
  await seedDemoUser();
  await disconnectDb();
  console.log('🌱 Seed complete');
}

seed().catch(async (error: unknown) => {
  console.error('❌ Seed failed:', error);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
