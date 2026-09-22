'use client';

import { Check, Minus, Replace } from 'lucide-react';
import type { CheckinStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CheckinControlProps {
  status: CheckinStatus | null;
  mealName: string;
  disabled?: boolean;
  onEaten: () => void;
  onSkipped: () => void;
  onClear: () => void;
  /** "Something else": opens the food picker for this meal. */
  onOther: () => void;
}

const base =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors disabled:opacity-60';

/**
 * Ate / Skipped / Something else for one planned meal. Pressing the chosen one again undoes
 * it; "Something else" always opens the picker, so a second food can be added to a swap.
 */
export function CheckinControl({ status, mealName, disabled, onEaten, onSkipped, onClear, onOther }: CheckinControlProps) {
  return (
    <div className="flex w-full gap-1 rounded-xl bg-canvas p-1 ring-1 ring-line" role="group" aria-label={`What happened to ${mealName}`}>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={status === 'eaten'}
        onClick={status === 'eaten' ? onClear : onEaten}
        className={cn(base, status === 'eaten' ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink')}
      >
        <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden="true" />
        Ate it
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={status === 'skipped'}
        onClick={status === 'skipped' ? onClear : onSkipped}
        className={cn(base, status === 'skipped' ? 'bg-surface-3 text-ink ring-1 ring-line-strong' : 'text-ink-soft hover:bg-surface-2 hover:text-ink')}
      >
        <Minus className="size-4 shrink-0" strokeWidth={3} aria-hidden="true" />
        Skipped
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={status === 'swapped'}
        onClick={onOther}
        className={cn(base, status === 'swapped' ? 'bg-water-50 text-water-700 ring-1 ring-water-200' : 'text-ink-soft hover:bg-surface-2 hover:text-ink')}
      >
        <Replace className="size-4 shrink-0" aria-hidden="true" />
        Other
      </button>
    </div>
  );
}
