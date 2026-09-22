import { useSyncExternalStore } from 'react';

/**
 * Where the app is navigating to, from the moment a link is tapped until the new page is on
 * screen. The progress bar and the tab bars read it, so feedback is instant even though the
 * current page stays in place until the next one is ready.
 */
let pendingHref: string | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function startNavigation(href: string): void {
  if (pendingHref === href) return;
  pendingHref = href;
  emit();
}

export function finishNavigation(): void {
  if (pendingHref === null) return;
  pendingHref = null;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The path being navigated to ("/grocery"), or null when nothing is loading. */
export function usePendingHref(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => pendingHref,
    () => null,
  );
}
