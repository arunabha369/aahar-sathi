import { z } from 'zod';
import { CITY_KEYS } from '../data/cities.ts';
import { ACTIVITIES, CUISINES, DIETS, FASTING_MODES, GENDERS, GOALS, PLAN_SLOTS, WEEKDAYS } from '../types.ts';

const uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'That id is not valid.');

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must look like YYYY-MM-DD.')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'That date does not exist.');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .max(120);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(100, 'Password must be 100 characters or fewer.');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(60),
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});
export type LoginBody = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'This reset link is not valid.').max(200, 'This reset link is not valid.'),
  password: passwordSchema,
});
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  age: z
    .number({ message: 'Age is required.' })
    .int('Age must be a whole number.')
    .min(18, 'Aahar Sathi is built for adults aged 18 and above.')
    .max(80, 'Please enter an age of 80 or below.'),
  gender: z.enum(GENDERS, { message: 'Choose a gender.' }),
  weightKg: z
    .number({ message: 'Weight is required.' })
    .min(30, 'Weight must be at least 30 kg.')
    .max(250, 'Weight must be 250 kg or less.'),
  heightCm: z
    .number({ message: 'Height is required.' })
    .min(120, 'Height must be at least 120 cm.')
    .max(220, 'Height must be 220 cm or less.'),
  activity: z.enum(ACTIVITIES, { message: 'Choose an activity level.' }),
  goal: z.enum(GOALS, { message: 'Choose a goal.' }),
  diet: z.enum(DIETS, { message: 'Choose a diet preference.' }),
  cuisine: z.enum(CUISINES, { message: 'Choose a cuisine preference.' }),
});
export type ProfileBody = z.infer<typeof profileSchema>;

export const idParamSchema = z.object({ id: uuid });
export type IdParams = z.infer<typeof idParamSchema>;

export const dateParamSchema = z.object({ date: isoDate });
export type DateParams = z.infer<typeof dateParamSchema>;

export const plansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type PlansQuery = z.infer<typeof plansQuerySchema>;

export const rangeQuerySchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: '"from" must be on or before "to".',
    path: ['from'],
  });
export type RangeQuery = z.infer<typeof rangeQuerySchema>;

export const swapSchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  slot: z.enum(PLAN_SLOTS),
});
export type SwapBody = z.infer<typeof swapSchema>;

export const grocerySchema = z.object({
  item: z.string().trim().min(1).max(120),
  checked: z.boolean(),
});
export type GroceryBody = z.infer<typeof grocerySchema>;

export const waterSchema = z.object({
  glasses: z.number().int().min(0, 'Glasses cannot be negative.').max(30, 'That is more than 30 glasses.'),
});
export type WaterBody = z.infer<typeof waterSchema>;

export const weightSchema = z.object({
  weightKg: z
    .number()
    .min(30, 'Weight must be at least 30 kg.')
    .max(250, 'Weight must be 250 kg or less.'),
});
export type WeightBody = z.infer<typeof weightSchema>;

/** "HH:MM" on a 24-hour clock, e.g. "23:15". */
const clockTime = (label: string) =>
  z
    .string({ message: `${label} is required.` })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${label} must be a time like 23:15.`);

/** Minutes from bedtime to waking, wrapping past midnight — the same rule the database uses. */
export function sleepMinutes(bedtime: string, wakeTime: string): number {
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  return (toMinutes(wakeTime) - toMinutes(bedtime) + 1440) % 1440;
}

export const MIN_SLEEP_MINUTES = 60;
export const MAX_SLEEP_MINUTES = 16 * 60;

export const sleepSchema = z
  .object({ bedtime: clockTime('Bedtime'), wakeTime: clockTime('Wake-up time') })
  .refine(
    ({ bedtime, wakeTime }) => {
      const minutes = sleepMinutes(bedtime, wakeTime);
      return minutes >= MIN_SLEEP_MINUTES && minutes <= MAX_SLEEP_MINUTES;
    },
    { message: 'That is not a night of sleep — it should be between 1 and 16 hours.', path: ['wakeTime'] },
  );
export type SleepBody = z.infer<typeof sleepSchema>;

// ---------- Food diary ----------

export const diaryDateSchema = z.object({ date: isoDate });

export const checkinParamsSchema = z.object({ date: isoDate, slot: z.enum(PLAN_SLOTS) });
export type CheckinParams = z.infer<typeof checkinParamsSchema>;

/** "Something else" is recorded by logging the food with a slot, so only these two are set directly. */
export const checkinSchema = z.object({ status: z.enum(['eaten', 'skipped']) });
export type CheckinBody = z.infer<typeof checkinSchema>;

export const entryParamsSchema = z.object({ date: isoDate, id: z.string().uuid('That entry id is not valid.') });
export type EntryParams = z.infer<typeof entryParamsSchema>;

const servings = z
  .number({ message: 'Servings are required.' })
  .gt(0, 'Servings must be more than 0.')
  .max(20, 'That is more than 20 servings.');
const macro = (label: string, max: number) =>
  z.number({ message: `${label} is required.` }).min(0, `${label} cannot be negative.`).max(max, `${label} looks too high.`);

/**
 * A food eaten outside the plan. Dishes and the user's own foods are looked up on the server
 * by reference; a barcode product carries the label's per-unit numbers from the lookup.
 */
export const entrySchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('meal'), ref: z.string().min(1).max(80), servings, slot: z.enum(PLAN_SLOTS).nullish() }),
  z.object({ source: z.literal('custom'), ref: z.string().uuid(), servings, slot: z.enum(PLAN_SLOTS).nullish() }),
  z.object({
    source: z.literal('barcode'),
    ref: z.string().regex(/^\d{8,14}$/, 'That barcode is not valid.'),
    servings,
    slot: z.enum(PLAN_SLOTS).nullish(),
    name: z.string().trim().min(1).max(120),
    servingLabel: z.string().trim().min(1).max(60),
    // Numbers for ONE of `servingLabel`; the server multiplies by servings.
    kcal: macro('Calories', 5000),
    protein: macro('Protein', 500),
    carbs: macro('Carbs', 500),
    fat: macro('Fat', 500),
  }),
]);
export type EntryBody = z.infer<typeof entrySchema>;

export const customFoodSchema = z.object({
  name: z.string().trim().min(1, 'Give the dish a name.').max(80, 'Keep the name under 80 characters.'),
  servingLabel: z.string().trim().min(1, 'Say what one serving is, e.g. “1 bowl”.').max(40),
  kcal: macro('Calories', 5000),
  protein: macro('Protein', 500),
  carbs: macro('Carbs', 500),
  fat: macro('Fat', 500),
});
export type CustomFoodBody = z.infer<typeof customFoodSchema>;

export const foodIdParamsSchema = z.object({ id: z.string().uuid('That id is not valid.') });

export const foodSearchSchema = z.object({ q: z.string().trim().min(1, 'Type something to search for.').max(60) });
export type FoodSearchQuery = z.infer<typeof foodSearchSchema>;

export const barcodeParamsSchema = z.object({ code: z.string().regex(/^\d{8,14}$/, 'A barcode is 8 to 14 digits.') });
export type BarcodeParams = z.infer<typeof barcodeParamsSchema>;

export const summaryQuerySchema = z.object({
  to: isoDate,
  days: z.coerce.number().int().min(7).max(90).default(7),
});
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;

// ---------- Plan preferences, adjustments, household ----------

export const preferencesSchema = z
  .object({
    jain: z.boolean(),
    fasting: z.enum(FASTING_MODES, { message: 'Choose a fasting mode.' }),
    vratDays: z.array(z.enum(WEEKDAYS)).max(7).transform((days) => WEEKDAYS.filter((day) => days.includes(day))),
    city: z.enum(CITY_KEYS, { message: 'Choose a city from the list.' }).nullable(),
  })
  .refine((value) => value.fasting !== 'ramadan' || value.city !== null, {
    message: 'Choose your city so we can work out sehri and iftar times.',
    path: ['city'],
  });
export type PreferencesBody = z.infer<typeof preferencesSchema>;

export const adjustmentSchema = z.object({
  change: z.union([z.literal(-100), z.literal(100)], { message: 'A change is 100 kcal up or down.' }),
});
export type AdjustmentBody = z.infer<typeof adjustmentSchema>;

export const todayQuerySchema = z.object({ today: isoDate.optional() });
export type TodayQuery = z.infer<typeof todayQuerySchema>;

export const memberSchema = z.object({
  name: z.string().trim().min(1, 'Give them a name.').max(40, 'Keep the name under 40 characters.'),
  age: profileSchema.shape.age,
  gender: profileSchema.shape.gender,
  weightKg: profileSchema.shape.weightKg,
  heightCm: profileSchema.shape.heightCm,
  activity: profileSchema.shape.activity,
  goal: profileSchema.shape.goal,
  diet: profileSchema.shape.diet,
  jain: z.boolean().default(false),
});
export type MemberBody = z.infer<typeof memberSchema>;

export const pantrySchema = z.object({
  item: z.string().trim().min(1).max(120),
  atHome: z.boolean(),
});
export type PantryBody = z.infer<typeof pantrySchema>;

export const fastingQuerySchema = z.object({ city: z.enum(CITY_KEYS).optional(), today: isoDate.optional() });
export type FastingQuery = z.infer<typeof fastingQuerySchema>;

export const recipeParamsSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,80}$/, 'That recipe does not exist.') });
export type RecipeParams = z.infer<typeof recipeParamsSchema>;

// ---------- Reminders ----------

const isTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

export const reminderSettingsSchema = z.object({
  timezone: z.string().min(1).max(64).refine(isTimeZone, 'That timezone is not recognised.'),
  water: z
    .object({
      enabled: z.boolean(),
      everyMinutes: z.union([z.literal(60), z.literal(90), z.literal(120), z.literal(180)]),
      from: clockTime('Start time'),
      to: clockTime('End time'),
    })
    .refine((water) => water.from < water.to, { message: 'Water reminders must end after they start.', path: ['to'] }),
  meals: z.object({
    enabled: z.boolean(),
    minutesBefore: z.union([z.literal(0), z.literal(15), z.literal(30)]),
  }),
  weighIn: z.object({
    enabled: z.boolean(),
    time: clockTime('Weigh-in time'),
    days: z.array(z.enum(WEEKDAYS)).min(1, 'Pick at least one day.').max(7),
  }),
  bedtime: z.object({
    enabled: z.boolean(),
    time: clockTime('Bedtime'),
  }),
});
export type ReminderSettingsBody = z.infer<typeof reminderSettingsSchema>;

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url('That push endpoint is not valid.').max(1000).startsWith('https://', 'Push endpoints use https.'),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});
export type PushSubscriptionBody = z.infer<typeof pushSubscriptionSchema>;

export const unsubscribeSchema = z.object({ endpoint: z.string().url().max(1000) });
export type UnsubscribeBody = z.infer<typeof unsubscribeSchema>;
