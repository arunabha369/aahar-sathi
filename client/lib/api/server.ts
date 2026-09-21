import { cookies } from 'next/headers';
import type { ApiErrorBody } from '@/lib/types';

// `||`, not `??`: hosts can expose an unset variable as an empty string.
const API_URL = process.env.API_URL?.trim() || 'http://localhost:5001';

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
 * Server Components call Express directly and forward the auth cookie, so the
 * first paint already has the user's data — no client round-trip.
 */
export async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      cookie: cookieStore.toString(),
      ...init.headers,
    },
    cache: 'no-store',
  });

  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : {};

  if (!response.ok) {
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
