import type { ReactNode } from 'react';
import { EmptyBasket, EmptyPlate, EmptyTrend } from '@/components/illustrations/Scenes';

const ART = {
  plate: EmptyPlate,
  basket: EmptyBasket,
  trend: EmptyTrend,
} as const;

export function EmptyState({
  art = 'plate',
  title,
  description,
  action,
}: {
  art?: keyof typeof ART;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const Art = ART[art];

  return (
    <div className="surface flex flex-col items-center gap-5 px-6 py-10 text-center sm:py-12">
      <div className="rounded-[1.25rem] bg-canvas p-2 ring-1 ring-line">
        <Art className="h-auto w-36 sm:w-40" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
