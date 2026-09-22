'use client';

import { useEffect } from 'react';
import './globals.css';

/**
 * The last resort: the root layout itself failed, so this replaces the whole document and
 * cannot use the app's components or fonts. Plain markup with the app's colours.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-extrabold text-ink">Aahar Sathi could not start</h1>
          <p className="text-[0.9375rem] leading-relaxed text-muted">
            Something went wrong while loading the app. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center rounded-2xl bg-accent px-5 text-[0.9375rem] font-semibold text-accent-ink"
          >
            Reload the app
          </button>
          {error.digest ? <p className="text-xs text-muted">Reference: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}
