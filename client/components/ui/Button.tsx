'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink hover:bg-accent-hover hover:shadow-[var(--shadow-brand)]',
  secondary:
    'bg-surface-2 text-ink ring-1 ring-line hover:bg-surface-3 hover:ring-line-strong',
  subtle: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
  ghost: 'text-ink-soft hover:bg-ink/5 hover:text-ink',
  danger: 'bg-chilli-500 text-accent-ink hover:bg-chilli-600',
  inverse: 'bg-ink text-canvas hover:bg-ink-soft',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-11 gap-1.5 rounded-xl px-3.5 text-[0.8125rem]',
  md: 'min-h-11 gap-2 rounded-xl px-4 text-sm',
  lg: 'min-h-12 gap-2 rounded-2xl px-6 text-[0.9375rem]',
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

const base =
  'inline-flex select-none items-center justify-center font-semibold transition-[background-color,box-shadow,transform,color] duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55';

export function Button({
  variant = 'primary',
  size = 'md',
  pending = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: BaseProps & Omit<ComponentPropsWithRef<'button'>, 'children'>) {
  return (
    <button
      {...props}
      disabled={disabled ?? pending}
      aria-busy={pending || undefined}
      className={cn(base, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
}: BaseProps & { href: string }) {
  return (
    <Link href={href} className={cn(base, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}>
      {children}
    </Link>
  );
}
