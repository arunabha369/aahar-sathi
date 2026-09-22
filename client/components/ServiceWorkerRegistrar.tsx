'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for everyone signed in, so pages are kept for offline use
 * (reminders register it too, but only for people who turn them on).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
    };
    // After load, so registering never competes with the page itself.
    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
    return undefined;
  }, []);

  return null;
}
