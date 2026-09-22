import { MACRO_COLORS } from '@/lib/constants';
import type { Macros, Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

/** The calorie ring: how much of the day's target has really been eaten. */
export function EatenRing({ eaten, target, size = 'md' }: { eaten: number; target: number; size?: 'sm' | 'md' }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const share = target > 0 ? Math.min(1, eaten / target) : 0;
  const left = target - eaten;
  const over = left < 0;

  return (
    <div className={cn('relative shrink-0', size === 'sm' ? 'size-28' : 'size-36 sm:size-40')}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-surface-3" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - share)}
          className={cn(
            'transition-[stroke-dashoffset] duration-700',
            over ? 'stroke-saffron-500' : 'stroke-accent',
            share === 0 && 'opacity-0',
          )}
        />
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={cn(
            'font-extrabold leading-none tracking-tight text-ink',
            size === 'sm' ? 'text-[1.375rem]' : 'text-[1.75rem] sm:text-[2rem]',
          )}
        >
          {Math.abs(Math.round(left)).toLocaleString('en-IN')}
        </span>
        <span className="mt-1 text-xs font-semibold text-muted">{over ? 'kcal over' : 'kcal left'}</span>
      </p>
    </div>
  );
}

/** One macro eaten against its target, with a thin bar in the macro's colour. */
function MacroProgress({ label, eaten, target, color }: { label: string; eaten: number; target: number; color: string }) {
  const left = Math.round(target - eaten);
  return (
    <div className="min-w-0 rounded-2xl bg-surface-2 p-2.5 sm:p-3">
      <dt className="flex items-center gap-1 text-xs font-semibold text-muted sm:gap-1.5">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5">
        <span className="block text-lg font-extrabold leading-none text-ink tabular-nums">{Math.round(eaten)} g</span>
        <span className="mt-0.5 block text-xs font-semibold text-muted tabular-nums">of {target} g</span>
        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.min(100, target > 0 ? (eaten / target) * 100 : 0)}%`, backgroundColor: color }}
          />
        </span>
        <span className="mt-1.5 block text-[0.6875rem] font-bold text-muted tabular-nums">
          {left >= 0 ? `${left} g left` : `${-left} g over`}
        </span>
      </dd>
    </div>
  );
}

/**
 * What has really been eaten today against the targets: the ring, the numbers beside it,
 * and one tile per macro. Nothing here is estimated from the clock.
 */
export function EatenSummary({ eaten, targets, planned }: { eaten: Macros; targets: Targets; planned?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6">
      <div className="flex items-center gap-5">
        <EatenRing eaten={eaten.kcal} target={targets.calories} />
        <dl className="min-w-0 space-y-3 text-[0.8125rem]">
          <div>
            <dt className="font-semibold text-muted">Eaten</dt>
            <dd className="font-bold text-ink tabular-nums">{eaten.kcal.toLocaleString('en-IN')} kcal</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">Your target</dt>
            <dd className="font-bold text-ink tabular-nums">{targets.calories.toLocaleString('en-IN')} kcal</dd>
          </div>
          {planned !== undefined ? (
            <div>
              <dt className="font-semibold text-muted">Planned</dt>
              <dd className="font-bold text-ink tabular-nums">{planned.toLocaleString('en-IN')} kcal</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <MacroProgress label="Protein" eaten={eaten.protein} target={targets.protein} color={MACRO_COLORS.protein} />
        <MacroProgress label="Carbs" eaten={eaten.carbs} target={targets.carbs} color={MACRO_COLORS.carbs} />
        <MacroProgress label="Fat" eaten={eaten.fat} target={targets.fat} color={MACRO_COLORS.fat} />
      </dl>
    </div>
  );
}
