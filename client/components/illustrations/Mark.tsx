import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The Aahar Sathi mark: a warm squircle holding a steaming bowl with a leaf.
 * Now uses a real generated image for a polished, production-level look.
 */
export function Mark({ className = 'size-10' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative block shrink-0 overflow-hidden rounded-xl bg-saffron-500', className)}
    >
      <Image
        src="/images/app-mark.jpg"
        alt=""
        fill
        sizes="40px"
        className="scale-[1.6] object-cover object-center"
      />
    </span>
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
