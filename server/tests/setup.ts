import pg from 'pg';
import { afterAll, afterEach } from 'vitest';

// These run before the test file (and therefore src/config/env.ts) is imported,
// so the server talks to a throwaway test database instead of a developer's .env.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-value-that-is-long-enough';
process.env.DEMO_ENABLED = 'true';
process.env.APP_URL = 'http://localhost:3000';
// Example credentials: Google's endpoints are stubbed in google.test.ts, never really called.
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
delete process.env.RESEND_API_KEY;
// Reminders are on in tests; web-push itself is mocked wherever a test would send one.
process.env.VAPID_PUBLIC_KEY = 'BExamplePublicKeyForTestsOnly';
process.env.VAPID_PRIVATE_KEY = 'example-private-key-for-tests';
process.env.CRON_SECRET = 'test-cron-secret-that-is-long-enough';

// A local Postgres; override with TEST_DATABASE_URL (never point it at real data —
// every table is emptied after each test).
const testUrl = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://localhost:5432/aahar_sathi_test');
process.env.DATABASE_URL = testUrl.toString();

// Create the test database on first run.
const adminUrl = new URL(testUrl);
adminUrl.pathname = '/postgres';
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
const dbName = testUrl.pathname.slice(1);
const { rowCount } = await admin.query('select 1 from pg_database where datname = $1', [dbName]);
if (rowCount === 0) await admin.query(`create database "${dbName.replace(/"/g, '""')}"`);
await admin.end();

const { pool, closeDatabase } = await import('../src/db/pool.ts');
const { SCHEMA_SQL } = await import('../src/db/schema.ts');
await pool.query(SCHEMA_SQL);

afterEach(async () => {
  const { devOutbox } = await import('../src/services/email.ts');
  devOutbox.length = 0;
  await pool.query('truncate app.users, app.meals, app.plans, app.water_logs, app.weight_logs, app.sleep_logs, app.password_resets, app.meal_checkins, app.food_entries, app.custom_foods cascade');
});

afterAll(async () => {
  await closeDatabase();
});
