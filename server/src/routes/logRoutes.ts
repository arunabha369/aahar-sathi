import { Router } from 'express';
import {
  deleteSleepLog,
  deleteWeightLog,
  listSleepLogs,
  listWaterLogs,
  listWeightLogs,
  setSleepLog,
  setWaterLog,
  setWeightLog,
} from '../controllers/logsController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import { dateParamSchema, rangeQuerySchema, sleepSchema, waterSchema, weightSchema } from '../validation/schemas.ts';

export const logRouter: Router = Router();

logRouter.use(requireAuth);

logRouter.get('/water', validate({ query: rangeQuerySchema }), listWaterLogs);
logRouter.put('/water/:date', validate({ params: dateParamSchema, body: waterSchema }), setWaterLog);

logRouter.get('/weight', validate({ query: rangeQuerySchema }), listWeightLogs);
logRouter.put('/weight/:date', validate({ params: dateParamSchema, body: weightSchema }), setWeightLog);
logRouter.delete('/weight/:date', validate({ params: dateParamSchema }), deleteWeightLog);

logRouter.get('/sleep', validate({ query: rangeQuerySchema }), listSleepLogs);
logRouter.put('/sleep/:date', validate({ params: dateParamSchema, body: sleepSchema }), setSleepLog);
logRouter.delete('/sleep/:date', validate({ params: dateParamSchema }), deleteSleepLog);
