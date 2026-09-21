import { closeDatabase, pool } from './pool.ts';
import { SCHEMA_SQL } from './schema.ts';

/** `npm run db:migrate`: creates or updates the tables. Safe to run as often as you like. */
async function migrate(): Promise<void> {
  await pool.query(SCHEMA_SQL);
  const { rows } = await pool.query<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'app' order by table_name`,
  );
  console.log(`✅ Schema "app" is up to date: ${rows.map((row) => row.table_name).join(', ')}`);
}

migrate()
  .catch((error: unknown) => {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
