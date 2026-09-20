'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string | undefined;
  hint?: string;
  suffix?: ReactNode;
  leading?: ReactNode;
}

export const inputShell =
  'min-h-12 w-full rounded-xl border bg-white px-3.5 text-[0.9375rem] font-medium text-ink shadow-xs transition-colors placeholder:font-normal placeholder:text-muted/70 focus:outline-none';

export function Field({ label, error, hint, suffix, leading, className, ...props }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-[0.8125rem] font-semibold text-ink-soft">
        {label}
      </label>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
            {leading}
          </span>
        ) : null}
        <input
          {...props}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            inputShell,
            error
              ? 'border-chilli-400 focus:border-chilli-500 focus:ring-2 focus:ring-chilli-500/15'
              : 'border-line hover:border-line-strong focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15',
            leading ? 'pl-10' : '',
            suffix ? 'pr-16' : '',
            className,
          )}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[0.8125rem] font-semibold text-muted">
            {suffix}
          </span>
        ) : null}
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
