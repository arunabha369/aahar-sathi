import { Router } from 'express';
import {
  addEntry,
  clearCheckin,
  createCustomFood,
  getDay,
  getSummary,
  listCustomFoods,
  lookupFoodBarcode,
  removeCustomFood,
  removeEntry,
  searchFoods,
  setCheckin,
} from '../controllers/diaryController.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { validate } from '../middleware/validate.ts';
import {
  barcodeParamsSchema,
  checkinParamsSchema,
  checkinSchema,
  customFoodSchema,
  diaryDateSchema,
  entryParamsSchema,
  entrySchema,
  foodIdParamsSchema,
  foodSearchSchema,
  summaryQuerySchema,
} from '../validation/schemas.ts';

/** What was actually eaten: check-ins against the plan, and foods logged outside it. */
export const diaryRouter: Router = Router();
diaryRouter.use(requireAuth);

// Registered before '/:date' so "summary" is never read as a date.
diaryRouter.get('/summary', validate({ query: summaryQuerySchema }), getSummary);
diaryRouter.get('/:date', validate({ params: diaryDateSchema }), getDay);
diaryRouter.put('/:date/checkins/:slot', validate({ params: checkinParamsSchema, body: checkinSchema }), setCheckin);
diaryRouter.delete('/:date/checkins/:slot', validate({ params: checkinParamsSchema }), clearCheckin);
diaryRouter.post('/:date/entries', validate({ params: diaryDateSchema, body: entrySchema }), addEntry);
diaryRouter.delete('/:date/entries/:id', validate({ params: entryParamsSchema }), removeEntry);

/** Finding foods to log: the meal list, the user's own dishes, and packaged products. */
export const foodRouter: Router = Router();
foodRouter.use(requireAuth);

foodRouter.get('/search', validate({ query: foodSearchSchema }), searchFoods);
foodRouter.get('/custom', listCustomFoods);
foodRouter.post('/custom', validate({ body: customFoodSchema }), createCustomFood);
foodRouter.delete('/custom/:id', validate({ params: foodIdParamsSchema }), removeCustomFood);
foodRouter.get('/barcode/:code', validate({ params: barcodeParamsSchema }), lookupFoodBarcode);
