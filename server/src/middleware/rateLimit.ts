import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/env.js';

const shared: Partial<Options> = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Rate limiting gets in the way of the test suite hammering the same endpoints.
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many attempts. Please wait a minute and try again.',
        code: 'TOO_MANY_REQUESTS',
      },
    });
  },
};

/** Sign-in / sign-up: strict, because these are the endpoints worth brute-forcing. */
export const authLimiter = rateLimit({ ...shared, windowMs: 15 * 60 * 1000, limit: 30 });

/** Everything else: generous, just enough to stop a runaway client. */
export const apiLimiter = rateLimit({ ...shared, windowMs: 60 * 1000, limit: 300 });

/** Plan generation is the most expensive thing the server does. */
export const planLimiter = rateLimit({ ...shared, windowMs: 60 * 1000, limit: 20 });
