'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CheckCircle2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DietIcon, GoalIcon } from '@/components/illustrations/OptionIcons';
import { ApiError, api } from '@/lib/api/client';
import { PlanEditorButton } from '@/components/plan/PlanEditor';
import { CUISINE_OPTIONS, DIET_OPTIONS, FASTING_LABELS, GOAL_OPTIONS } from '@/lib/constants';
import { formatPlanMoment } from '@/lib/format';
import type { PlanSummary } from '@/lib/types';

export function PlanHistory({ plans }: { plans: PlanSummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const activate = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      try {
        await api.post(`/plans/${id}/activate`);
        router.refresh();
        toast.success('That plan is active again');
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not activate that plan.');
      } finally {
        setBusyId(null);
      }
    });
  };

  const remove = (id: string) => {
    if (!window.confirm('Delete this plan? This cannot be undone.')) return;
    setBusyId(id);
    startTransition(async () => {
      try {
        await api.delete(`/plans/${id}`);
        router.refresh();
        toast.success('Plan deleted');
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not delete that plan.');
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => {
        const goal = GOAL_OPTIONS.find((option) => option.value === plan.goal);
        const diet = DIET_OPTIONS.find((option) => option.value === plan.diet);
        const cuisine = CUISINE_OPTIONS.find((option) => option.value === plan.cuisine);
        const when = formatPlanMoment(plan.createdAt);
        const extras = [
          FASTING_LABELS[plan.fasting],
          plan.jain ? 'Jain' : null,
          plan.people > 1 ? `For ${plan.people} people` : null,
        ].filter((extra): extra is string => Boolean(extra));

        return (
          <li key={plan.id} className="surface flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{when}</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-ink">
                  {plan.calories.toLocaleString('en-IN')} kcal
                  {plan.isActive ? (
                    <Badge tone="brand" size="sm">
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Active
                    </Badge>
                  ) : null}
                </h2>
              </div>
              <Link
                href={`/plans/${plan.id}`}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-muted ring-1 ring-line transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label={`Open the plan from ${when}`}
              >
                <ArrowUpRight className="size-[1.125rem]" aria-hidden="true" />
              </Link>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-line py-3">
              <div>
                <dt className="text-[0.6875rem] font-semibold text-muted">Protein</dt>
                <dd className="text-sm font-bold text-ink tabular-nums">{plan.protein} g</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-semibold text-muted">BMI</dt>
                <dd className="text-sm font-bold text-ink tabular-nums">{plan.bmi.toFixed(1)}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-semibold text-muted">Category</dt>
                <dd className="truncate text-sm font-bold text-ink">{plan.bmiCategory}</dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.8125rem] font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5">
                <GoalIcon goal={plan.goal} className="size-4 text-saffron-700" />
                {goal?.label}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <DietIcon diet={plan.diet} className="size-4" />
                {diet?.label}
              </span>
              <span aria-hidden="true">·</span>
              <span>{cuisine?.label}</span>
            </div>

            {extras.length > 0 ? (
              <p className="mt-2 flex flex-wrap gap-1.5">
                {extras.map((extra) => (
                  <Badge key={extra} size="sm">
                    {extra}
                  </Badge>
                ))}
              </p>
            ) : null}

            {plan.dishes.length > 0 ? (
              <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-muted">
                <span className="font-semibold text-ink-soft">On the menu:</span> {plan.dishes.join(' · ')}
              </p>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <PlanEditorButton target={{ kind: 'edit', planId: plan.id }} size="sm" />
              {!plan.isActive ? (
                <Button size="sm" variant="secondary" onClick={() => activate(plan.id)} pending={busyId === plan.id}>
                  Make active
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remove(plan.id)}
                disabled={busyId === plan.id}
                className="text-chilli-600 hover:bg-chilli-50 hover:text-chilli-700"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
