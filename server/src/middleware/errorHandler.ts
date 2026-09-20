import type { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { isProduction } from '../config/env.js';
import { zodToApiError } from './validate.js';

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyPattern?: Record<string, unknown>;
}

function isDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
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
  } else if (error instanceof MongooseError.ValidationError) {
    apiError = new ApiError(
      400,
      'VALIDATION_ERROR',
      'Some of the details you entered are not valid.',
      Object.values(error.errors).map((issue) => ({
        field: issue.path,
        message: issue.message,
      })),
    );
  } else if (error instanceof MongooseError.CastError) {
    apiError = ApiError.badRequest('That id is not valid.');
  } else if (isDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'value';
    apiError = ApiError.conflict(
      field === 'email' ? 'An account with this email already exists.' : `That ${field} is already taken.`,
    );
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
