import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.ts';
import { isProduction } from '../config/env.ts';
import { zodToApiError } from './validate.ts';

/** Postgres reports what went wrong as a SQLSTATE code plus the constraint involved. */
interface PostgresError extends Error {
  code: string;
  constraint?: string;
}

function isPostgresError(error: unknown): error is PostgresError {
  if (!(error instanceof Error)) return false;
  const { code } = error as { code?: unknown };
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code);
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`No API route matches ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    apiError = zodToApiError(error);
  } else if (error instanceof SyntaxError && (error as { type?: unknown }).type === 'entity.parse.failed') {
    // express.json() could not parse the request body.
    apiError = ApiError.badRequest('The request body is not valid JSON.');
  } else if (isPostgresError(error) && error.code === '23505') {
    // unique_violation — in practice, two sign-ups racing for the same email.
    apiError = ApiError.conflict(
      error.constraint === 'users_email_key' ? 'An account with this email already exists.' : 'That already exists.',
    );
  } else if (isPostgresError(error) && error.code === '22P02') {
    // invalid_text_representation — a malformed id that slipped past validation.
    apiError = ApiError.badRequest('That id is not valid.');
  } else if (isPostgresError(error) && error.code === '23514') {
    // check_violation — the database's own range checks.
    apiError = new ApiError(400, 'VALIDATION_ERROR', 'Some of the details you entered are not valid.');
  } else if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
    apiError = ApiError.unauthorized('Your session has expired. Please sign in again.');
  } else {
    apiError = new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong on our side.');
  }

  if (apiError.status >= 500) {
    console.error('[error]', error);
  }

  res.status(apiError.status).json({
    error: {
      message: apiError.message,
      code: apiError.code,
      ...(apiError.details !== undefined ? { details: apiError.details } : {}),
      ...(!isProduction && apiError.status >= 500 && error instanceof Error
        ? { stack: error.stack }
        : {}),
    },
  });
}
