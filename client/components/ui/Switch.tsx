'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** An on/off setting: the whole row is the target, and it reads as a switch to screen readers. */
export function Switch({ checked, onChange, label, description, disabled = false, className }: SwitchProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex min-h-11 items-center justify-between gap-4 rounded-xl py-2',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span> : null}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-surface-3 ring-1 ring-line-strong transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-ink-soft after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-5 peer-checked:after:bg-accent-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand-700 motion-reduce:after:transition-none"
      />
    </label>
  );
}
