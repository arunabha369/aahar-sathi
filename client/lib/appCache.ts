/**
 * The service worker keeps a copy of pages you have opened so they work offline. Those copies
 * hold one person's plan and diary, so they are thrown away whenever the account changes:
 * signing in, signing out, or deleting the account.
 */
export function clearCachedPages(): void {
  if (typeof window === 'undefined') return;
  navigator.serviceWorker?.controller?.postMessage('clear-pages');
  if (!('caches' in window)) return;
  void caches
    .keys()
    .then((names) => Promise.all(names.filter((name) => name.startsWith('pages-')).map((name) => caches.delete(name))))
    .catch(() => undefined);
}
