import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),
  // Postgres connection string — Supabase: Project Settings → Database → Connection string.
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((value) => /^postgres(ql)?:\/\//.test(value), 'DATABASE_URL must start with postgresql://'),
  // Optional: the Supabase CA certificate (PEM text or a file path) to verify the TLS connection.
  DATABASE_CA_CERT: z.string().optional(),
  // Serverless (Vercel) runs many small instances, so each keeps only a couple of connections.
  // Where the website lives, for links in emails and the Google sign-in redirect.
  // Hosts can expose an unset variable as an empty string: treat that as not set.
  APP_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().url('APP_URL must be a full URL like https://aaharsathi.in').optional(),
  ),
  // Password reset emails (resend.com). Without a key the link is printed to the server log.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Aahar Sathi <no-reply@aaharsathi.in>'),
  // "Continue with Google" appears only when both are set (Google Cloud → Credentials).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Reminders (web push). Generate a pair with `npx web-push generate-vapid-keys`; reminders
  // are offered only when both keys are set. The subject is a contact for the push services.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:support@aaharsathi.in'),
  // Shared secret the scheduler sends to /api/reminders/run (as "Authorization: Bearer …").
  CRON_SECRET: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(24, 'CRON_SECRET must be at least 24 characters').optional(),
  ),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(process.env.VERCEL ? 2 : 10),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  DEMO_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // Fail fast: the API is useless without a database and a signing secret. Throwing (not
  // process.exit) stops the standalone server just the same, without killing Next.js when
  // the API runs inside it.
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const COOKIE_NAME = 'token';
export const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** The site's own origin, with no trailing slash. */
export function appUrl(): string {
  const url = env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

export const googleSignInEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const remindersEnabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
