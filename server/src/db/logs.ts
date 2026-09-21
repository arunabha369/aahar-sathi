import { pool } from './pool.ts';

export interface WaterEntry {
  date: string;
  glasses: number;
}

export interface WeightEntry {
  date: string;
  weightKg: number;
}

interface Range {
  from: string;
  to: string;
}

export async function listWaterLogs(userId: string, { from, to }: Range): Promise<WaterEntry[]> {
  const { rows } = await pool.query<WaterEntry>(
    `select date, glasses from app.water_logs
     where user_id = $1 and date between $2 and $3
     order by date`,
    [userId, from, to],
  );
  return rows;
}

/** One row per user per day: logging again for the same day replaces the count. */
export async function upsertWaterLog(userId: string, date: string, glasses: number): Promise<WaterEntry> {
  const { rows } = await pool.query<WaterEntry>(
    `insert into app.water_logs (user_id, date, glasses) values ($1, $2, $3)
     on conflict (user_id, date) do update set glasses = excluded.glasses
     returning date, glasses`,
    [userId, date, glasses],
  );
  return rows[0]!;
}

export async function listWeightLogs(userId: string, { from, to }: Range): Promise<WeightEntry[]> {
  const { rows } = await pool.query<WeightEntry>(
    `select date, weight_kg as "weightKg" from app.weight_logs
     where user_id = $1 and date between $2 and $3
     order by date`,
    [userId, from, to],
  );
  return rows;
}

export async function upsertWeightLog(userId: string, date: string, weightKg: number): Promise<WeightEntry> {
  const { rows } = await pool.query<WeightEntry>(
    `insert into app.weight_logs (user_id, date, weight_kg) values ($1, $2, $3)
     on conflict (user_id, date) do update set weight_kg = excluded.weight_kg
     returning date, weight_kg as "weightKg"`,
    [userId, date, weightKg],
  );
  return rows[0]!;
}

/** Returns false when there was nothing logged for that day. */
export async function deleteWeightLog(userId: string, date: string): Promise<boolean> {
  const { rowCount } = await pool.query('delete from app.weight_logs where user_id = $1 and date = $2', [
    userId,
    date,
  ]);
  return rowCount === 1;
}

/** Bulk insert for the seed: one statement for the whole month. */
export async function insertLogs(userId: string, water: WaterEntry[], weight: WeightEntry[]): Promise<void> {
  await pool.query(
    `insert into app.water_logs (user_id, date, glasses)
     select $1::uuid, w.date, w.glasses from jsonb_to_recordset($2::jsonb) as w(date date, glasses integer)`,
    [userId, JSON.stringify(water)],
  );
  await pool.query(
    `insert into app.weight_logs (user_id, date, weight_kg)
     select $1::uuid, w.date, w."weightKg" from jsonb_to_recordset($2::jsonb) as w(date date, "weightKg" double precision)`,
    [userId, JSON.stringify(weight)],
  );
}

export async function deleteLogsForUser(userId: string): Promise<void> {
  await pool.query('delete from app.water_logs where user_id = $1', [userId]);
  await pool.query('delete from app.weight_logs where user_id = $1', [userId]);
}
