/** Browser side of reminders: the service worker, permission, and the push subscription. */

export type PushSupport = 'supported' | 'unsupported' | 'ios-needs-install';

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  const hasApis = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (hasApis) return 'supported';
  // iPhone and iPad only offer web push to apps added to the Home Screen (iOS 16.4+).
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  return ios && !standalone ? 'ios-needs-install' : 'unsupported';
}

/** The VAPID public key (base64url) as the bytes PushManager wants. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64url}${'='.repeat((4 - (base64url.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  const registered = existing ?? (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));
  await navigator.serviceWorker.ready;
  return registered;
}

/** This browser's subscription, if reminders are on here. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'supported') return null;
  const existing = await navigator.serviceWorker.getRegistration('/');
  return existing ? existing.pushManager.getSubscription() : null;
}

export class PermissionDeniedError extends Error {}

/** Asks for permission (if needed) and subscribes this browser. */
export async function subscribe(publicKey: string): Promise<PushSubscription> {
  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (permission !== 'granted') throw new PermissionDeniedError('Notifications are blocked for this site.');
  const worker = await registration();
  const existing = await worker.pushManager.getSubscription();
  if (existing) return existing;
  return worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
}

export function subscriptionBody(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return { endpoint: subscription.endpoint, keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' } };
}
