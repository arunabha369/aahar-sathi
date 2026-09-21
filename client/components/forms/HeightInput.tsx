'use client';

import { useId, useState } from 'react';
import { feetInchesToCm, heightToFeetInches } from '@/lib/format';
import { cn } from '@/lib/utils';

interface HeightInputProps {
  valueCm: string;
  onChange: (cm: string) => void;
  error?: string | undefined;
}

/** Height is stored in centimetres; feet and inches are just another way to type it. */
export function HeightInput({ valueCm, onChange, error }: HeightInputProps) {
  const id = useId();
  const [mode, setMode] = useState<'cm' | 'ft'>('cm');
  const parsed = Number(valueCm);
  const { feet, inches } = Number.isFinite(parsed) && parsed > 0 ? heightToFeetInches(parsed) : { feet: 0, inches: 0 };

  const updateFeetInches = (nextFeet: number, nextInches: number) => {
    if (nextFeet === 0 && nextInches === 0) {
      onChange('');
      return;
    }
    onChange(String(feetInchesToCm(nextFeet, nextInches)));
  };

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={mode === 'cm' ? `${id}-cm` : `${id}-ft`} className="text-[0.8125rem] font-semibold text-ink-soft">
          Height
        </label>
        <div className="inline-flex rounded-lg bg-canvas p-0.5 ring-1 ring-line" role="group" aria-label="Height unit">
          {(['cm', 'ft'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={cn(
                'min-h-11 rounded-md px-3.5 text-xs font-bold transition-colors',
                mode === option ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink',
              )}
            >
              {option === 'cm' ? 'cm' : 'ft + in'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'cm' ? (
        <div className="relative">
          <input
            id={`${id}-cm`}
            type="number"
            inputMode="numeric"
            min={120}
            max={220}
            value={valueCm}
            onChange={(event) => onChange(event.target.value)}
            placeholder="170"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              'min-h-12 w-full rounded-xl border bg-white px-3.5 pr-14 text-base font-medium text-ink sm:text-[0.9375rem] shadow-xs transition-colors focus:outline-none',
              error
                ? 'border-chilli-400 focus:border-chilli-500 focus:ring-2 focus:ring-chilli-500/15'
                : 'border-line hover:border-line-strong focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15',
            )}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[0.8125rem] font-semibold text-muted">
            cm
          </span>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              id={`${id}-ft`}
              type="number"
              inputMode="numeric"
              min={3}
              max={7}
              value={feet || ''}
              onChange={(event) => updateFeetInches(Number(event.target.value || 0), inches)}
              placeholder="5"
              aria-label="Feet"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className={cn(
                'min-h-12 w-full rounded-xl border bg-white px-3.5 pr-12 text-base font-medium text-ink shadow-xs transition-colors focus:outline-none sm:text-[0.9375rem]',
                error
                  ? 'border-chilli-400 focus:border-chilli-500 focus:ring-2 focus:ring-chilli-500/15'
                  : 'border-line hover:border-line-strong focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15',
              )}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[0.8125rem] font-semibold text-muted">
              ft
            </span>
          </div>
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={11}
              value={feet || inches ? inches : ''}
              onChange={(event) => updateFeetInches(feet, Number(event.target.value || 0))}
              placeholder="7"
              aria-label="Inches"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className={cn(
                'min-h-12 w-full rounded-xl border bg-white px-3.5 pr-12 text-base font-medium text-ink shadow-xs transition-colors focus:outline-none sm:text-[0.9375rem]',
                error
                  ? 'border-chilli-400 focus:border-chilli-500 focus:ring-2 focus:ring-chilli-500/15'
                  : 'border-line hover:border-line-strong focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15',
              )}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[0.8125rem] font-semibold text-muted">
              in
            </span>
          </div>
        </div>
      )}

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.8125rem] font-semibold text-chilli-600">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-muted">
          {valueCm && !error ? `That is ${feet} ft ${inches} in · ${valueCm} cm` : 'Between 120 cm and 220 cm'}
        </p>
      )}
    </div>
  );
}
