import { z } from 'zod';
import { ACTIVITIES, CUISINES, DIETS, GENDERS, GOALS, PLAN_SLOTS } from '../types.ts';

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
