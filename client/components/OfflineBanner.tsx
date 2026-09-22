'use client';

import { WifiOff } from 'lucide-react';
import { useOnline } from '@/lib/online';

/**
 * A quiet line across the top while the connection is gone. Ticks and logs carry on working —
 * they are held and sent when the connection comes back.
 */
export function OfflineBanner() {
  const online = useOnline();

  return (
    <div role="status" aria-live="polite" className="no-print">
      {online ? null : (
        <p className="flex items-center justify-center gap-2 bg-water-50 px-4 py-2 text-center text-[0.8125rem] font-semibold text-water-700 ring-1 ring-inset ring-water-200">
          <WifiOff className="size-4 shrink-0" aria-hidden="true" />
          You’re offline. Ticks and logs are saved when you’re back.
        </p>
      )}
    </div>
  );
}
