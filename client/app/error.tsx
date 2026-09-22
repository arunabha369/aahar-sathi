'use client';

import { useEffect } from 'react';
import { ErrorScreen } from '@/components/ui/ErrorScreen';

/** Anything that fails outside the signed-in app: the marketing pages and the auth screens. */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      title="Something went wrong"
      description="That page could not be loaded. It is usually a passing hiccup — try again, and if it keeps happening, come back in a few minutes."
      onRetry={reset}
      reference={error.digest}
      home={{ href: '/', label: 'Go to the home page' }}
    />
  );
}
