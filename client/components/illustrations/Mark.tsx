import { cn } from '@/lib/utils';

/**
 * The Aahar Sathi mark: a warm squircle holding a steaming bowl with a leaf.
 * Drawn rather than iconified so it holds up at every size.
 */
export function Mark({ className = 'size-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-hidden="true" className={className}>
      <rect width="40" height="40" rx="12.5" fill="#F97316" />
      <path d="M0 12.5A12.5 12.5 0 0 1 12.5 0H27c-9 6.5-17 14-24 22.5Z" fill="#FDB022" />
      <path d="M40 27.5A12.5 12.5 0 0 1 27.5 40H13c9.5-6.5 18-14.5 27-24Z" fill="#E11D48" fillOpacity="0.85" />
      <path d="M0 26c6.5 4 13 5.4 20 4.2S33.6 25.8 40 21.4V27.5A12.5 12.5 0 0 1 27.5 40h-15A12.5 12.5 0 0 1 0 27.5Z" fill="#7A1020" fillOpacity="0.12" />

      {/* steam */}
      <g stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="1.7" strokeLinecap="round" fill="none">
        <path d="M14.8 12.4c1.5-1.1 1.5-2.4 0-3.5" />
        <path d="M20 11.9c1.7-1.3 1.7-2.8 0-4.1" />
        <path d="M25.2 12.4c1.5-1.1 1.5-2.4 0-3.5" />
      </g>

      {/* bowl */}
      <path d="M8.6 19.4h22.8a1 1 0 0 1 1 1.1C31.9 26.9 26.5 32 20 32S8.1 26.9 7.6 20.5a1 1 0 0 1 1-1.1Z" fill="#FFFFFF" />
      <rect x="6" y="16.6" width="28" height="3.6" rx="1.8" fill="#FFFFFF" />
      <path d="M20 22.6c3 0 5.5 2.2 6 5.2-3.1.5-5.8-1.6-6-5.2Z" fill="#12B76A" />
      <path d="M20 22.6c-3 0-5.5 2.2-6 5.2 3.1.5 5.8-1.6 6-5.2Z" fill="#039855" />
    </svg>
  );
}

export function Wordmark({
  className,
  tone = 'ink',
  tagline = true,
}: {
  className?: string;
  tone?: 'ink' | 'light';
  tagline?: boolean;
}) {
  return (
    <span className={cn('flex min-w-0 flex-col leading-none', className)}>
      <span
        className={cn(
          'text-[1.0625rem] font-extrabold tracking-tight',
          tone === 'light' ? 'text-white' : 'text-ink',
        )}
      >
        Aahar Sathi
      </span>
      {tagline ? (
        <span
          className={cn(
            'mt-1 truncate text-[0.6875rem] font-semibold',
            tone === 'light' ? 'text-white/85' : 'text-muted',
          )}
        >
          Your Indian diet companion
        </span>
      ) : null}
    </span>
  );
}
