/*
 * Aahar Sathi service worker: reminders only. It shows push notifications and opens the
 * app when one is tapped. It deliberately does not cache pages, so the app is never stale.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
