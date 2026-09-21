'use client';

import { useSyncExternalStore } from 'react';

/** Chromium's install event — not in the DOM typings because only Chrome, Edge and Samsung Internet fire it. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * - `available`: the browser handed us its install prompt, so a button can open it.
 * - `ios`: iPhone and iPad never fire that event; installing is Share → Add to Home Screen.
 * - `installed`: already running as the installed app.
 * - `unsupported`: no prompt (yet). Firefox on desktop cannot install web apps, and Chrome
 *   also stays quiet when the app is already installed on this device.
 */
export type InstallState = 'available' | 'ios' | 'installed' | 'unsupported';

let deferred: BeforeInstallPromptEvent | null = null;
let justInstalled = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// Registered when this module first loads — before React hydrates — because the
// browser fires beforeinstallprompt once per page load and does not repeat it.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Keep the event so our own "Install app" button can open the prompt later.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    justInstalled = true;
    notify();
  });
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so check for touch as well.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function getSnapshot(): InstallState {
  if (justInstalled || isStandalone()) return 'installed';
  if (deferred) return 'available';
  if (isIos()) return 'ios';
  return 'unsupported';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const standalone = window.matchMedia('(display-mode: standalone)');
  standalone.addEventListener('change', listener);
  return () => {
    listeners.delete(listener);
    standalone.removeEventListener('change', listener);
  };
}

/** `null` during server render and hydration, so nothing install-related flashes or mismatches. */
export function useInstallState(): InstallState | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** Opens the browser's own install dialog. Resolves to whether the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  // A prompt event can only be used once.
  deferred = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === 'accepted';
}
