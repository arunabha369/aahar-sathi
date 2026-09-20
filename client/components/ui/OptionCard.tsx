'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'saffron' | 'water' | 'chilli';

const SELECTED: Record<Tone, string> = {
  brand: 'border-brand-600 bg-brand-50/70 ring-brand-600/15',
  saffron: 'border-saffron-500 bg-saffron-50/70 ring-saffron-500/15',
  water: 'border-water-500 bg-sky-50/70 ring-water-500/15',
  chilli: 'border-chilli-500 bg-red-50/70 ring-chilli-500/15',
};

const CHECK: Record<Tone, string> = {
  brand: 'bg-brand-700',
  saffron: 'bg-saffron-600',
  water: 'bg-water-600',
  chilli: 'bg-chilli-600',
};

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  compact?: boolean;
}

export function OptionCard({
  selected,
  onSelect,
  label,
  description,
  hint,
  icon,
  tone = 'brand',
  compact = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-2xl border bg-white text-left shadow-xs transition-all duration-150',
        'hover:border-line-strong hover:shadow-sm active:scale-[0.99]',
        compact ? 'min-h-14 px-3.5 py-3' : 'min-h-[4.25rem] px-4 py-3.5',
        selected ? cn('ring-4', SELECTED[tone]) : 'border-line',
      )}
    >
      {icon ? (
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-xl transition-colors',
            compact ? 'size-9' : 'size-11',
            selected ? 'bg-white shadow-xs' : 'bg-canvas',
          )}
        >
          {icon}
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-bold leading-tight text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-snug text-muted">{description}</span> : null}
      </span>

      {hint ? <span className="shrink-0 text-xs font-bold tabular-nums text-muted">{hint}</span> : null}

      <span
        aria-hidden="true"
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full transition-all',
          selected ? CHECK[tone] : 'border-2 border-line-strong bg-white group-hover:border-muted',
        )}
      >
        {selected ? <Check className="size-3 text-white" strokeWidth={3.5} /> : null}
      </span>
    </button>
  );
}
