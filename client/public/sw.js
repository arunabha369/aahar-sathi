/*
 * Aahar Sathi service worker.
 *
 * Two jobs:
 *  - reminders: show push notifications and open the app when one is tapped;
 *  - offline: keep the last copy of pages you have opened, so the grocery list and today's
 *    meals still appear in a shop with no signal.
 *
 * Pages are fetched from the network first and only fall back to the stored copy, so nothing
 * stale is ever shown while there is a connection. Signing out empties the page cache, since
 * those copies hold one person's data.
 */

const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const OFFLINE_URL = '/offline';

/** Files that never change without a new URL, so the stored copy is always right. */
const isImmutable = (pathname) =>
  pathname.startsWith('/_next/static/') ||
  pathname.startsWith('/images/') ||
  pathname.startsWith('/wasm/') ||
  /^\/(icon|apple-icon|icon-\d+|icon-maskable-\d+)/.test(pathname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== SHELL_CACHE && name !== PAGE_CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

/** Signing out (or another account signing in) must not leave the last person's pages behind. */
self.addEventListener('message', (event) => {
  if (event.data === 'clear-pages') event.waitUntil(caches.delete(PAGE_CACHE));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Only plain, complete pages are worth storing.
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: false });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // The API is never cached: it is this person's live data, and it needs the session cookie.
  if (url.pathname.startsWith('/api/')) return;

  if (isImmutable(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  }
});

/** Only ever open a page of this app, whatever a payload says. */
function safeUrl(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/dashboard';
}

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { body: event.data ? event.data.text() : '' };
  }
  const title = typeof message.title === 'string' && message.title ? message.title : 'Aahar Sathi';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof message.body === 'string' ? message.body : '',
      icon: '/icon-192.png',
      tag: typeof message.tag === 'string' ? message.tag : undefined,
      data: { url: safeUrl(message.url) },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(safeUrl(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          // navigate() only works on windows this worker controls; otherwise just bring it forward.
          return client.focus().then((focused) => focused.navigate(target).catch(() => focused));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
