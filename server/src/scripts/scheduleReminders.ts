/**
 * Registers the reminder scheduler in the database: a Supabase pg_cron job that calls
 * POST {APP_URL}/api/reminders/run every five minutes, with CRON_SECRET, through pg_net.
 *
 *   npm run reminders:schedule            # create or update the job
 *   npm run reminders:schedule -- --off   # remove it
 *
 * Run it once after deploying, against the production database. pg_cron and pg_net must be
 * available (Supabase: Database → Extensions). The secret is stored in the job's command,
 * which only database administrators can read.
 */
import { appUrl, env } from '../config/env.ts';
import { closeDatabase, pool } from '../db/pool.ts';

const JOB = 'aahar-sathi-reminders';
const EVERY_FIVE_MINUTES = '*/5 * * * *';

async function main(): Promise<void> {
  const off = process.argv.includes('--off');
  await pool.query('create extension if not exists pg_cron');
  await pool.query(`select cron.unschedule(jobid) from cron.job where jobname = $1`, [JOB]);
  if (off) {
    console.log(`Removed the "${JOB}" job.`);
    return;
  }

  if (!env.CRON_SECRET) throw new Error('Set CRON_SECRET (the same value as on the server) first.');
  const url = `${appUrl()}/api/reminders/run`;
  if (/\/\/(localhost|127\.0\.0\.1)/.test(url)) {
    throw new Error(`APP_URL points at ${url}; the database can't reach your computer. Set APP_URL to the live site.`);
  }

  await pool.query('create extension if not exists pg_net');
  // format() quotes the values, so neither the URL nor the secret can break out of the SQL.
  const { rows } = await pool.query<{ command: string }>(
    `select format(
       'select net.http_post(url := %L, headers := jsonb_build_object(''Authorization'', %L, ''Content-Type'', ''application/json''), body := ''{}''::jsonb, timeout_milliseconds := 25000)',
       $1::text, $2::text
     ) as command`,
    [url, `Bearer ${env.CRON_SECRET}`],
  );
  await pool.query('select cron.schedule($1, $2, $3)', [JOB, EVERY_FIVE_MINUTES, rows[0]!.command]);
  console.log(`Scheduled "${JOB}": ${url} every five minutes.`);
}

main()
  .catch((error: unknown) => {
    console.error('Could not schedule reminders:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
