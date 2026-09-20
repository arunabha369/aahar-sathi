import { cn } from '@/lib/utils';

/** Soft spice-toned blobs that sit behind the hero, so the panel is not a flat slab. */
export function HeroGlow({ className, idPrefix = 'glow' }: { className?: string; idPrefix?: string }) {
  return (
    <svg
      viewBox="0 0 800 600"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    >
      <defs>
        <radialGradient id={`${idPrefix}-1`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#12B76A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#12B76A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${idPrefix}-2`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FDB022" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FDB022" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${idPrefix}-3`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#36BFFA" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#36BFFA" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="260" fill={`url(#${idPrefix}-1)`} />
      <circle cx="700" cy="180" r="240" fill={`url(#${idPrefix}-2)`} />
      <circle cx="520" cy="560" r="280" fill={`url(#${idPrefix}-3)`} />
    </svg>
  );
}

/** A hand-drawn underline for the word the hero leans on. */
export function Underline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 14" aria-hidden="true" className={cn('h-3 w-full', className)} preserveAspectRatio="none">
      <path
        d="M3 9.5c38-5 76-7 114-6 34 1 62 3 100 6"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}

/** The curved edge between the dark hero and the page below it. */
export function WaveDivider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" className={cn('block h-12 w-full', className)}>
      <path d="M0 80V34c220 34 460 46 720 34S1220 26 1440 0v80Z" fill="currentColor" />
    </svg>
  );
}
