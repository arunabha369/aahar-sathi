import type { Diet } from '@/lib/types';
import { cn } from '@/lib/utils';

const MARK: Record<Diet, { color: string; label: string }> = {
  veg: { color: '#3fb950', label: 'Vegetarian' },
  egg: { color: '#e3b341', label: 'Contains egg' },
  nonveg: { color: '#f26b62', label: 'Non-vegetarian' },
};

/** The square-and-dot food mark Indian packaging uses, so the diet reads at a glance. */
export function DietMark({ diet, className }: { diet: Diet; className?: string }) {
  const { color, label } = MARK[diet];
  return (
    <svg viewBox="0 0 16 16" className={cn('size-4 shrink-0', className)} role="img" aria-label={label}>
      <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke={color} strokeWidth="1.6" />
      {diet === 'nonveg' ? <path d="M8 4.2 11.8 11H4.2Z" fill={color} /> : <circle cx="8" cy="8" r="3.4" fill={color} />}
    </svg>
  );
}
