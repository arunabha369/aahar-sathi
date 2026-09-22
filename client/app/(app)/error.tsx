'use client';

import { useEffect } from 'react';
import { ErrorScreen } from '@/components/ui/ErrorScreen';

/** A page of the signed-in app that could not be built — the navigation around it still works. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      title="We could not load this page"
      description="Your plan and everything you have logged are safe. This is usually a passing hiccup — try again, or open another part of the app."
      onRetry={reset}
      reference={error.digest}
    />
  );
}
