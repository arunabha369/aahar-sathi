'use client';

import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputShell } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  error?: string | undefined;
  hint?: string;
  options: { value: string; label: string }[];
}

/** A native select (the phone's own picker), styled like the other fields. */
export function SelectField({ label, error, hint, options, className, ...props }: SelectFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-[0.8125rem] font-semibold text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            inputShell,
            'appearance-none pr-10',
            error
              ? 'border-chilli-400 focus:border-chilli-500 focus:ring-2 focus:ring-chilli-500/15'
              : 'border-line hover:border-line-strong focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15',
            className,
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.8125rem] font-semibold text-chilli-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
