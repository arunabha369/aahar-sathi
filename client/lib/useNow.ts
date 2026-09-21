'use client';

import { useSyncExternalStore } from 'react';

/** Re-render once a minute (and when the tab comes back), which is all "up next" needs. */
function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 30_000);
  document.addEventListener('visibilitychange', onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onChange);
  };
}

/**
 * Minutes since local midnight, or null during server render and hydration —
 * the server cannot know the viewer's clock, so callers render a placeholder first.
 */
export function useMinutesNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    },
    () => null,
  );
}
