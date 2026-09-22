'use client';

import Link from 'next/link';
import { RefreshCw, TriangleAlert, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorScreenProps {
  title: string;
  description: string;
  /** Next's reset(): re-renders the part of the page that failed. */
  onRetry?: () => void;
  /** Shown under the buttons, e.g. Next's error digest, so a report can be matched to a log. */
  reference?: string | undefined;
  tone?: 'error' | 'offline';
  /** Where "go somewhere that works" leads. */
  home?: { href: string; label: string };
}

/** What people see when a page cannot be shown: what happened, and a way out of it. */
export function ErrorScreen({
  title,
  description,
  onRetry,
  reference,
  tone = 'error',
  home = { href: '/dashboard', label: 'Go to your dashboard' },
}: ErrorScreenProps) {
  const Icon = tone === 'offline' ? WifiOff : TriangleAlert;

  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <span
        className={
          tone === 'offline'
            ? 'grid size-16 place-items-center rounded-2xl bg-water-50 text-water-700 ring-1 ring-inset ring-water-200'
            : 'grid size-16 place-items-center rounded-2xl bg-saffron-50 text-saffron-700 ring-1 ring-inset ring-saffron-200'
        }
      >
        <Icon className="size-8" aria-hidden="true" />
      </span>

      <h1 className="mt-6 text-2xl font-extrabold text-ink sm:text-[1.75rem]">{title}</h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{description}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <Button onClick={onRetry} size="lg">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        ) : null}
        <Link
          href={home.href}
          className="inline-flex min-h-12 items-center rounded-2xl bg-surface-2 px-5 text-[0.9375rem] font-semibold text-ink ring-1 ring-line transition-colors hover:bg-surface-3"
        >
          {home.label}
        </Link>
      </div>

      {reference ? <p className="mt-6 text-xs text-muted">Reference: {reference}</p> : null}
    </div>
  );
}
