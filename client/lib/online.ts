'use client';

import { useSyncExternalStore } from 'react';

function subscribe(listener: () => void): () => void {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

/** Whether the browser thinks it has a connection. Assumes online while rendering on the server. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

/** Resolves as soon as there is a connection again — at once when there already is one. */
export function whenOnline(): Promise<void> {
  if (typeof navigator === 'undefined' || navigator.onLine) return Promise.resolve();
  return new Promise((resolve) => {
    const onOnline = () => {
      window.removeEventListener('online', onOnline);
      resolve();
    };
    window.addEventListener('online', onOnline);
  });
}

/**
 * Sends a change, waiting out a lost connection rather than failing on it: it holds until the
 * browser is online, and a network failure mid-flight is retried once more the same way.
 * Only the server refusing (an ApiError) or a second network failure gives up.
 */
export async function sendWhenOnline<T>(
  request: () => Promise<T>,
  isServerError: (error: unknown) => boolean,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    await whenOnline();
    try {
      return await request();
    } catch (error) {
      if (isServerError(error) || attempt > 0) throw error;
    }
  }
}
