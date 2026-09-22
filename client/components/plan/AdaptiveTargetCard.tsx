'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PlanBuildingOverlay, withBuildingScreen } from '@/components/plan/PlanBuildingOverlay';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import type { AdjustmentSuggestion } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AdaptiveTargetCardProps {
  suggestion: AdjustmentSuggestion;
  calories: number;
  /** The date the suggestion was worked out for, sent back so the server checks the same one. */
  today: string;
  /** Dashboard: only speak up when there is something to decide. */
  compact?: boolean;
}

const signed = (value: number) => `${value > 0 ? '+' : '−'}${Math.abs(value)}`;

export function AdaptiveTargetCard({ suggestion, calories, today, compact = false }: AdaptiveTargetCardProps) {
  const router = useRouter();
  const toast = useToast();
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();
  const [applying, startApplying] = useTransition();

  if (hidden || (compact && suggestion.status !== 'suggest')) return null;

  const apply = () =>
    startApplying(async () => {
      try {
        await withBuildingScreen(api.post(`/profile/adjustment?today=${today}`, { change: suggestion.change }));
        toast.success('Target updated and a new plan made');
        router.refresh();
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : 'We could not update your target.');
      }
    });

  const dismiss = () =>
    startTransition(async () => {
      try {
        await api.post('/profile/adjustment/dismiss');
        setHidden(true);
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : 'Something went wrong.');
      }
    });

  const Icon = suggestion.change !== null && suggestion.change > 0 ? TrendingUp : suggestion.change !== null ? TrendingDown : Target;
  const trend = suggestion.trend;

  return (
    <section
      aria-labelledby="adaptive-heading"
      className={cn(
        'rounded-2xl p-4 ring-1 ring-inset sm:p-5',
        suggestion.status === 'suggest' ? 'bg-brand-50 ring-brand-200' : 'bg-surface-2 ring-line',
      )}
      data-print="hide"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface ring-1 ring-line">
          <Icon className="size-[1.125rem] text-brand-700" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="adaptive-heading" className="text-[0.9375rem] font-bold text-ink">
            {suggestion.status === 'suggest' && suggestion.change !== null
              ? `Try ${calories + suggestion.change} kcal a day (${signed(suggestion.change)})`
              : suggestion.status === 'on-track'
                ? 'Your target is working'
                : 'Calorie target check'}
          </h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
            {suggestion.reason}
            {suggestion.status === 'suggest' ? ' A small step like this is easy to live with, and we’ll check again in two weeks.' : ''}
            {suggestion.quietUntil && suggestion.status === 'recently-adjusted'
              ? ` Next check from ${formatDate(suggestion.quietUntil)}.`
              : ''}
          </p>
          {trend ? (
            <p className="mt-1.5 text-xs text-muted tabular-nums">
              Trend {trend.kgPerWeek > 0 ? '+' : ''}
              {trend.kgPerWeek.toFixed(2)} kg a week · {trend.weighIns} weigh-ins over {trend.spanDays} days
              {suggestion.currentAdjustment !== 0 ? ` · adjusted ${signed(suggestion.currentAdjustment)} kcal so far` : ''}
            </p>
          ) : null}
          {suggestion.status === 'suggest' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <PlanBuildingOverlay show={applying} title="Updating your target and plan" doneTitle="Your new target is set" />
              <Button size="sm" onClick={apply} pending={applying} disabled={pending}>
                Use {calories + (suggestion.change ?? 0)} kcal
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss} disabled={pending || applying}>
                Not now
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
