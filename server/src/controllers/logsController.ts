import type { Request, Response } from 'express';
import { WaterLog } from '../models/WaterLog.js';
import { WeightLog } from '../models/WeightLog.js';
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
  const logs = await WaterLog.find({ user: currentUserId(req), date: { $gte: from, $lte: to } })
    .sort({ date: 1 })
    .lean();

  res.json({
    from,
    to,
    logs: logs.map((log) => ({ date: log.date, glasses: log.glasses })),
  });
}

export async function setWaterLog(req: Request, res: Response): Promise<void> {
  const { date } = validParams<DateParams>(req);
  const { glasses } = validBody<WaterBody>(req);

  const log = await WaterLog.findOneAndUpdate(
    { user: currentUserId(req), date },
    { $set: { glasses } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );

  res.json({ log: { date: log.date, glasses: log.glasses } });
}

export async function listWeightLogs(req: Request, res: Response): Promise<void> {
  const { from, to } = resolveRange(validQuery<RangeQuery>(req));
  const logs = await WeightLog.find({ user: currentUserId(req), date: { $gte: from, $lte: to } })
    .sort({ date: 1 })
    .lean();

  res.json({
    from,
    to,
    logs: logs.map((log) => ({ date: log.date, weightKg: log.weightKg })),
  });
}

export async function setWeightLog(req: Request, res: Response): Promise<void> {
  const { date } = validParams<DateParams>(req);
  const { weightKg } = validBody<WeightBody>(req);

  const log = await WeightLog.findOneAndUpdate(
    { user: currentUserId(req), date },
    { $set: { weightKg } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );

  res.json({ log: { date: log.date, weightKg: log.weightKg } });
}

export async function deleteWeightLog(req: Request, res: Response): Promise<void> {
  const { date } = validParams<DateParams>(req);
  const result = await WeightLog.deleteOne({ user: currentUserId(req), date });
  if (result.deletedCount === 0) {
    throw ApiError.notFound('There is no weight logged for that day.');
  }
  res.json({ ok: true });
}
