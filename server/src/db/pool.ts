import { readFileSync } from 'node:fs';
import { attachDatabasePool } from '@vercel/functions';
import pg from 'pg';
import { env } from '../config/env.ts';

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
  // On Vercel an instance stays awake until its idle connections close, so close them sooner.
  idleTimeoutMillis: process.env.VERCEL ? 5_000 : 30_000,
  // TCP keep-alives stop routers and the pooler from silently dropping idle connections.
  keepAlive: true,
});

/**
 * A pooled connection can still die between uses (the network or Supabase's pooler resets
 * it). A read that fails that way is simply retried once on a fresh connection. Writes are
 * never retried automatically: the first attempt may have been applied, and running it
 * twice could, say, log the same food twice — the caller sees the error instead.
 */
const CONNECTION_ERROR_CODES = new Set(['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED']);
function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const { code } = error as { code?: unknown };
  return (
    (typeof code === 'string' && CONNECTION_ERROR_CODES.has(code)) ||
    /Connection terminated|terminating connection|Client has encountered a connection error/i.test(error.message)
  );
}
const isReadOnly = (text: unknown) => typeof text === 'string' && /^\s*(select|with)\b/i.test(text) && !/\b(insert|update|delete)\b/i.test(text);

const queryOnce = pool.query.bind(pool) as (...args: unknown[]) => Promise<unknown>;
pool.query = (async (...args: unknown[]) => {
  try {
    return await queryOnce(...args);
  } catch (error) {
    if (isConnectionError(error) && isReadOnly(args[0])) return queryOnce(...args);
    throw error;
  }
}) as typeof pool.query;

// On Vercel: lets idle connections close before an instance is suspended, instead of leaking
// them on Supabase's pooler. Does nothing anywhere else.
attachDatabasePool(pool);

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
