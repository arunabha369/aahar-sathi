'use client';

import { useSyncExternalStore } from 'react';
import { todayKey } from '@/lib/format';

/** Re-reads the date when the tab comes back, so a plan left open overnight catches up. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('visibilitychange', onChange);
  window.addEventListener('focus', onChange);
  return () => {
    window.removeEventListener('visibilitychange', onChange);
    window.removeEventListener('focus', onChange);
  };
}

/**
 * The browser's own calendar day, which is the day a log belongs to. The server
 * snapshot keeps hydration consistent; React swaps in the local value right after.
 */
export function useLocalToday(serverToday: string): string {
  return useSyncExternalStore(
    subscribe,
    () => todayKey(),
    () => serverToday,
  );
}
