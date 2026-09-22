import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false },
};

/**
 * Shown when a page is opened with no connection and no stored copy of it. Deliberately plain
 * — no data, no JavaScript needed — so it works in the worst case.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-water-50 text-water-700 ring-1 ring-inset ring-water-200">
        <WifiOff className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold text-ink sm:text-[1.75rem]">You’re offline</h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        This page hasn’t been opened on this device yet, so there is nothing saved to show. Pages you have already
        visited — your plan and grocery list — still work.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/grocery"
          className="inline-flex min-h-12 items-center rounded-2xl bg-accent px-5 text-[0.9375rem] font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
        >
          Grocery list
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-12 items-center rounded-2xl bg-surface-2 px-5 text-[0.9375rem] font-semibold text-ink ring-1 ring-line transition-colors hover:bg-surface-3"
        >
          Today’s plan
        </Link>
      </div>
    </div>
  );
}
