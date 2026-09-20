import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-canvas text-ink-soft ring-line',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  saffron: 'bg-saffron-50 text-saffron-800 ring-saffron-200',
  water: 'bg-sky-50 text-water-700 ring-sky-200',
  chilli: 'bg-red-50 text-chilli-700 ring-red-200',
  ink: 'bg-ink text-white ring-transparent',
} as const;

export function Badge({
  children,
  className,
  tone = 'neutral',
  size = 'md',
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof TONES;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[0.6875rem]' : 'px-2.5 py-1 text-xs',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
