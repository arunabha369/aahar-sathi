'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { finishNavigation, startNavigation, usePendingHref } from '@/lib/navigationProgress';
import { cn } from '@/lib/utils';

/** A navigation that takes longer than this has stalled; stop showing progress rather than hang. */
const GIVE_UP_MS = 15_000;

/** Is this click an in-app navigation to a different page? Returns where it goes. */
function internalTarget(event: MouseEvent): string | null {
  // No defaultPrevented check: Next's <Link> cancels the browser's navigation on every click
  // to do its own. A link that deliberately goes nowhere can opt out with data-no-progress.
  if (event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = (event.target as Element | null)?.closest?.('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== '_self') return null;
  if (anchor.hasAttribute('download') || anchor.hasAttribute('data-no-progress')) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  // API routes and files are not page navigations.
  if (url.pathname.startsWith('/api/') || /\.[a-z0-9]+$/i.test(url.pathname)) return null;
  const target = `${url.pathname}${url.search}`;
  // Same page (or only a #hash): nothing loads.
  if (target === `${window.location.pathname}${window.location.search}`) return null;
  return target;
}

/**
 * The slim bar along the top of the screen while the next page loads. The page you are on
 * stays visible meanwhile, so switching tabs never flashes an empty screen.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pending = usePendingHref();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = internalTarget(event);
      if (target) startNavigation(target);
    };
    // Capture phase: seen before any link's own handler runs.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // The new page is on screen once the URL has changed.
  const search = searchParams?.toString() ?? '';
  useEffect(() => {
    finishNavigation();
  }, [pathname, search]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(finishNavigation, GIVE_UP_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <>
      {/* Screen readers hear that a page is loading; Next announces the new page when it arrives. */}
      <p className="sr-only" role="status" aria-live="polite">
        {pending ? 'Loading page…' : ''}
      </p>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden">
        <div
          className={cn(
            'h-full origin-left bg-accent shadow-[0_0_10px_var(--color-accent)]',
            pending
              ? 'animate-[nav-progress_8s_cubic-bezier(0.1,0.7,0.2,1)_forwards] opacity-100 motion-reduce:animate-none motion-reduce:scale-x-100 motion-reduce:opacity-70'
              : 'scale-x-100 opacity-0 transition-opacity duration-300',
          )}
        />
      </div>
    </>
  );
}
