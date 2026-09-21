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
