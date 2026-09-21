import { readFileSync } from 'node:fs';
import pg from 'pg';
import { env } from '../config/env.js';

// DATE columns hold the user's calendar day ('YYYY-MM-DD'). Left alone, pg turns them
// into JavaScript Dates at local midnight, which shifts the day across timezones.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const SSL_PARAMS = ['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat'];

/**
 * Supabase only accepts encrypted connections, while a local Postgres usually has no TLS.
 * SSL settings inside the URL would silently override the ones set here, so they are
 * stripped and TLS is decided in one place:
 * - local hosts: plain connection;
 * - anything else: TLS, verified against DATABASE_CA_CERT when it is set (the Supabase
 *   dashboard offers the certificate under Database → SSL configuration), otherwise
 *   encrypted without certificate verification.
 */
function connectionConfig(): pg.PoolConfig {
  const url = new URL(env.DATABASE_URL);
  for (const param of SSL_PARAMS) url.searchParams.delete(param);

  if (LOCAL_HOSTS.has(url.hostname)) {
    return { connectionString: url.toString() };
  }

  const ca = env.DATABASE_CA_CERT;
  if (!ca) {
    return { connectionString: url.toString(), ssl: { rejectUnauthorized: false } };
  }
  const pem = ca.includes('-----BEGIN') ? ca.replace(/\\n/g, '\n') : readFileSync(ca, 'utf8');
  return { connectionString: url.toString(), ssl: { ca: pem, rejectUnauthorized: true } };
}

export const pool = new pg.Pool({
  ...connectionConfig(),
  max: env.DATABASE_POOL_SIZE,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
});

// An idle client losing its connection (a pooler restart, say) must not crash the server.
pool.on('error', (error) => {
  console.error('[db] idle client error:', error.message);
});

export type Queryable = Pick<pg.Pool | pg.PoolClient, 'query'>;

/** Runs `work` inside one transaction on one connection; any throw rolls it all back. */
export async function withTransaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/** Fails fast with a readable message when the database is unreachable or not migrated. */
export async function checkDatabase(): Promise<void> {
  const { rows } = await pool.query<{ ready: boolean }>(
    `select to_regclass('app.meals') is not null as ready`,
  );
  if (!rows[0]?.ready) {
    throw new Error('The database is reachable but has no tables yet. Run `npm run db:migrate`, then `npm run seed`.');
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
