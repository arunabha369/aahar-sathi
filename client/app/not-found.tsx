import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyPlate } from '@/components/illustrations/Scenes';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <EmptyPlate className="w-32 sm:w-36" />
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-1.5 text-2xl font-extrabold text-ink sm:text-[1.75rem]">We could not find that page</h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        The link may be old, or the address may have a typo in it.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex min-h-12 items-center rounded-2xl bg-accent px-5 text-[0.9375rem] font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
        >
          Go to your dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-2xl bg-surface-2 px-5 text-[0.9375rem] font-semibold text-ink ring-1 ring-line transition-colors hover:bg-surface-3"
        >
          Home page
        </Link>
      </div>
    </div>
  );
}
