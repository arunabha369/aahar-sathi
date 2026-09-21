import type { Request, Response } from 'express';
import * as logs from '../db/logs.js';
import { ApiError } from '../utils/ApiError.js';
import { currentUserId } from '../middleware/requireAuth.js';
import { validBody, validParams, validQuery } from '../middleware/validate.js';
import { addDays, toDateKey } from '../utils/date.js';
import type { DateParams, RangeQuery, WaterBody, WeightBody } from '../validation/schemas.js';

const DEFAULT_RANGE_DAYS = 90;

/** Falls back to the last 90 days so a chart always has something to draw. */
function resolveRange(range: RangeQuery): { from: string; to: string } {
  const to = range.to ?? toDateKey(new Date());
  const from = range.from ?? toDateKey(addDays(new Date(`${to}T00:00:00`), -(DEFAULT_RANGE_DAYS - 1)));
  return { from, to };
}

export async function listWaterLogs(req: Request, res: Response): Promise<void> {
  const { from, to } = resolveRange(validQuery<RangeQuery>(req));
  res.json({ from, to, logs: await logs.listWaterLogs(currentUserId(req), { from, to }) });
}

export async function setWaterLog(req: Request, res: Response): Promise<void> {
  const { date } = validParams<DateParams>(req);
  const { glasses } = validBody<WaterBody>(req);

  res.json({ log: await logs.upsertWaterLog(currentUserId(req), date, glasses) });
}

export async function listWeightLogs(req: Request, res: Response): Promise<void> {
  const { from, to } = resolveRange(validQuery<RangeQuery>(req));
  res.json({ from, to, logs: await logs.listWeightLogs(currentUserId(req), { from, to }) });
}

export async function setWeightLog(req: Request, res: Response): Promise<void> {
  const { date } = validParams<DateParams>(req);
  const { weightKg } = validBody<WeightBody>(req);

  res.json({ log: await logs.upsertWeightLog(currentUserId(req), date, weightKg) });
}

export async function deleteWeightLog(req: Request, res: Response): Promise<void> {
  const { date } = validParams<DateParams>(req);
  if (!(await logs.deleteWeightLog(currentUserId(req), date))) {
    throw ApiError.notFound('There is no weight logged for that day.');
  }
  res.json({ ok: true });
}
