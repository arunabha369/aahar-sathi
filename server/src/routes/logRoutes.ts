import { Router } from 'express';
import {
  deleteWeightLog,
  listWaterLogs,
  listWeightLogs,
  setWaterLog,
  setWeightLog,
} from '../controllers/logsController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { dateParamSchema, rangeQuerySchema, waterSchema, weightSchema } from '../validation/schemas.js';

export const logRouter: Router = Router();

logRouter.use(requireAuth);

logRouter.get('/water', validate({ query: rangeQuerySchema }), listWaterLogs);
logRouter.put('/water/:date', validate({ params: dateParamSchema, body: waterSchema }), setWaterLog);

logRouter.get('/weight', validate({ query: rangeQuerySchema }), listWeightLogs);
logRouter.put('/weight/:date', validate({ params: dateParamSchema, body: weightSchema }), setWeightLog);
logRouter.delete('/weight/:date', validate({ params: dateParamSchema }), deleteWeightLog);
