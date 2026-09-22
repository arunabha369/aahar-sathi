import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PieChart } from 'lucide-react';
import { Panel, PanelHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MacroDonut, MacroLegend } from '@/components/charts/MacroDonut';
import { WeekCaloriesChart } from '@/components/charts/WeekCaloriesChart';
import { ActivatePlanButton } from '@/components/plan/ActivatePlanButton';
import { CalculationPanel } from '@/components/plan/CalculationPanel';
import { PlanEditorButton } from '@/components/plan/PlanEditor';
import { DayTabs } from '@/components/plan/DayTabs';
import { StatCards } from '@/components/plan/StatCards';
import { cityName } from '@/lib/api/cities';
import { ServerApiError, serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import { formatPlanMoment, todayKey } from '@/lib/format';
import type { PlanResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Plan',
  robots: { index: false },
};

export default async function PlanDetailPage(props: PageProps<'/plans/[id]'>) {
  await requireCompleteProfile();
  const { id } = await props.params;

  let plan;
  try {
    ({ plan } = await serverFetch<PlanResponse>(`/plans/${id}`));
  } catch (error) {
    if (error instanceof ServerApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }

  const city = await cityName(plan.inputs.preferences?.city);

  return (
    <div className="animate-rise">
      <Link
        href="/plans"
        className="no-print mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All plans
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">Saved plan</p>
          <h1 className="flex flex-wrap items-center gap-3 text-[1.75rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[2rem]">
            {formatPlanMoment(plan.createdAt)}
            {plan.isActive ? <Badge tone="brand">Active</Badge> : <Badge>Read only</Badge>}
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted">
            {plan.targets.calories.toLocaleString('en-IN')} kcal a day · {plan.targets.protein} g protein
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PlanEditorButton target={{ kind: 'edit', planId: plan.id }} label="Edit plan" />
          {!plan.isActive ? <ActivatePlanButton planId={plan.id} /> : null}
        </div>
      </header>

      <StatCards targets={plan.targets} />

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Panel>
            <PanelHeader
              eyebrow="This week"
              title="The meals"
              description={
                plan.isActive
                  ? 'Your active plan. Swap anything you do not fancy, or edit the plan to change its settings.'
                  : 'Make this plan active to swap its meals, or edit it to rebuild it with different settings.'
              }
            />
            <DayTabs
              planId={plan.id}
              days={plan.days}
              targets={plan.targets}
              diet={plan.inputs.diet}
              serverToday={todayKey()}
              cityName={city}
              readOnly={!plan.isActive}
            />
          </Panel>
          <Panel>
            <WeekCaloriesChart days={plan.days} targets={plan.targets} />
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <Panel>
            <PanelHeader
              eyebrow="Targets"
              title="Macro split"
              icon={<PieChart className="size-[1.125rem] text-brand-700" aria-hidden="true" />}
            />
            <MacroDonut targets={plan.targets} hideTitle />
            <MacroLegend targets={plan.targets} />
          </Panel>
          <CalculationPanel inputs={plan.inputs} targets={plan.targets} />
        </div>
      </div>
    </div>
  );
}
