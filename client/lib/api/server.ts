import 'server-only';
import { cookies, headers } from 'next/headers';
import { callExpress } from '@/lib/api/callExpress';
import type { ApiErrorBody } from '@/lib/types';

export class ServerApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ServerApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Server Components call the Express API in-process — no HTTP hop, no URL to configure —
 * forwarding the auth cookie, so the first paint already has the user's data.
 */
export async function serverFetch<T>(path: string): Promise<T> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  // The visitor's IP, so rate limits apply per person rather than to "the web server".
  const forwardedFor = requestHeaders.get('x-forwarded-for');

  const response = await callExpress(`/api${path}`, {
    cookie: cookieStore.toString(),
    ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
  });

  const body: unknown = response.body ? JSON.parse(response.body) : {};

  if (response.status >= 400) {
    const error = (body as ApiErrorBody).error;
    throw new ServerApiError(
      response.status,
      error?.code ?? 'INTERNAL_ERROR',
      error?.message ?? 'The server could not be reached.',
    );
  }

  return body as T;
}

/** Returns null on 401/404 instead of throwing, for optional data. */
export async function serverFetchOrNull<T>(path: string): Promise<T | null> {
  try {
    return await serverFetch<T>(path);
  } catch (error) {
    if (error instanceof ServerApiError && (error.status === 401 || error.status === 404)) {
      return null;
    }
    throw error;
  }
}
