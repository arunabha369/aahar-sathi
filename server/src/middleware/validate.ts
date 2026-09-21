import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ApiError } from '../utils/ApiError.ts';

export interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function zodToApiError(error: ZodError): ApiError {
  const details = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  const first = details[0];
  const message = first?.field
    ? `${first.field}: ${first.message}`
    : (first?.message ?? 'Some of the details you entered are not valid.');
  return new ApiError(400, 'VALIDATION_ERROR', message, details);
}

/** Validates the request before the controller runs. Parsed values are coerced/defaulted. */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      if (schemas.query) req.validQuery = schemas.query.parse(req.query ?? {});
      if (schemas.params) req.validParams = schemas.params.parse(req.params ?? {});
      next();
    } catch (error) {
      next(error instanceof ZodError ? zodToApiError(error) : error);
    }
  };
}

/** Typed accessors for what `validate` stored. */
export function validQuery<T>(req: Request): T {
  return req.validQuery as T;
}

export function validParams<T>(req: Request): T {
  return req.validParams as T;
}

export function validBody<T>(req: Request): T {
  return req.body as T;
}
