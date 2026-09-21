import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './config/env.ts';
import { apiLimiter } from './middleware/rateLimit.ts';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.ts';
import { apiRouter } from './routes/index.ts';

export function createApp(): Express {
  const app = express();

  // Behind Vercel's proxy the client IP arrives in X-Forwarded-For,
  // which express-rate-limit and `secure` cookies both depend on.
  if (isProduction) app.set('trust proxy', 1);

  app.use(helmet());
  // Inside Next.js (the normal setup) the browser calls /api on the same origin, so CORS
  // only matters for the standalone server during development.
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV === 'development') app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'aahar-sathi-api', env: env.NODE_ENV });
  });

  app.use('/api', apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
