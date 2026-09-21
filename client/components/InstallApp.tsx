'use client';

import type { ReactNode } from 'react';
import { CheckCircle2, Download, MonitorSmartphone, Share, SquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { promptInstall, useInstallState } from '@/lib/installPrompt';
import { cn } from '@/lib/utils';

function useInstall() {
  const toast = useToast();
  return async () => {
    if (await promptInstall()) toast.success('Aahar Sathi is installed — find it with your other apps');
  };
}

/** A small "Install app" control for the nav. Renders only when the browser can install right now. */
export function InstallAppButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  const state = useInstallState();
  const install = useInstall();
  if (state !== 'available') return null;

  return (
    <button
      type="button"
      onClick={install}
      aria-label={compact ? 'Install the Aahar Sathi app' : undefined}
      className={cn(
        'flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold transition-colors',
        compact
          ? 'min-w-11 justify-center px-2.5 text-accent hover:bg-surface-2'
          : 'w-full gap-3 bg-brand-50 px-3 text-brand-800 ring-1 ring-inset ring-brand-200 hover:bg-brand-100',
        className,
      )}
    >
      <Download className="size-[1.125rem] shrink-0" aria-hidden="true" />
      {compact ? <span className="text-[0.8125rem]">Install</span> : 'Install app'}
    </button>
  );
}

function Step({ number, children }: { number: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-ink-soft">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-bold text-ink">
        {number}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

/** Settings panel body: the right way to install for whichever browser this is. */
export function InstallAppPanel() {
  const state = useInstallState();
  const install = useInstall();

  if (state === null) {
    // Server render and hydration: reserve the space without guessing the browser.
    return <div className="skeleton h-24 rounded-2xl" aria-hidden="true" />;
  }

  if (state === 'installed') {
    return (
      <p className="flex items-center gap-2.5 rounded-2xl bg-brand-50 px-4 py-3.5 text-sm font-semibold text-brand-800 ring-1 ring-inset ring-brand-200">
        <CheckCircle2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
        You are using the installed app. Open it from your home screen or app list any time.
      </p>
    );
  }

  if (state === 'available') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface-2 px-4 py-4 ring-1 ring-line">
        <p className="max-w-md text-sm text-muted">
          Opens full-screen from your home screen or dock, with no browser bars — like any other app.
        </p>
        <Button onClick={install}>
          <Download className="size-4" aria-hidden="true" />
          Install app
        </Button>
      </div>
    );
  }

  if (state === 'ios') {
    return (
      <div className="rounded-2xl bg-surface-2 px-4 py-4 ring-1 ring-line">
        <p className="text-sm font-bold text-ink">On iPhone and iPad</p>
        <ol className="mt-3 space-y-2.5">
          <Step number={1}>
            Tap the <Share className="inline size-4 align-[-3px] text-water-600" aria-hidden="true" /> Share button in
            the browser bar.
          </Step>
          <Step number={2}>
            Choose <SquarePlus className="inline size-4 align-[-3px] text-ink" aria-hidden="true" />{' '}
            <strong className="font-bold text-ink">Add to Home Screen</strong>. You may need to scroll the list.
          </Step>
          <Step number={3}>Tap Add. Aahar Sathi opens full-screen from its icon.</Step>
        </ol>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-4 ring-1 ring-line">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <MonitorSmartphone className="size-4 text-muted" aria-hidden="true" />
        Install from your browser menu
      </p>
      <ul className="mt-3 space-y-2 text-sm text-ink-soft">
        <li>
          <strong className="font-bold text-ink">Chrome or Edge:</strong> click the install icon at the right of the
          address bar, or find <strong className="font-bold text-ink">Install Aahar Sathi</strong> in the menu (Chrome:
          Cast, save and share; Edge: Apps).
        </li>
        <li>
          <strong className="font-bold text-ink">Android:</strong> open the browser menu and tap{' '}
          <strong className="font-bold text-ink">Install app</strong> or{' '}
          <strong className="font-bold text-ink">Add to Home screen</strong>.
        </li>
        <li>
          <strong className="font-bold text-ink">Safari on Mac:</strong> File → Add to Dock.
        </li>
        <li>
          <strong className="font-bold text-ink">Firefox on a computer</strong> does not install web apps — open this
          page in Chrome, Edge or Safari instead.
        </li>
      </ul>
      <p className="mt-3 text-xs text-muted">
        If there is no install option, it may already be installed on this device.
      </p>
    </div>
  );
}
