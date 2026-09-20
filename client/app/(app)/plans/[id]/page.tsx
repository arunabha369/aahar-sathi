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
import { DayTabs } from '@/components/plan/DayTabs';
import { StatCards } from '@/components/plan/StatCards';
import { ServerApiError, serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import { formatDate, todayKey } from '@/lib/format';
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

  return (
    <div className="animate-rise">
      <Link
        href="/plans"
        className="no-print mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All plans
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">Saved plan</p>
          <h1 className="flex flex-wrap items-center gap-3 text-[1.75rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[2rem]">
            {formatDate(plan.createdAt.slice(0, 10))}
            {plan.isActive ? <Badge tone="brand">Active</Badge> : <Badge>Read only</Badge>}
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted">
            {plan.targets.calories.toLocaleString('en-IN')} kcal a day · {plan.targets.protein} g protein
          </p>
        </div>
        {!plan.isActive ? <ActivatePlanButton planId={plan.id} /> : null}
      </header>

      <StatCards targets={plan.targets} />

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Panel>
            <PanelHeader
              eyebrow="This week"
              title="The meals"
              description="This plan is read-only. Make it active to swap or shuffle its meals."
            />
            <DayTabs
              planId={plan.id}
              days={plan.days}
              targets={plan.targets}
              diet={plan.inputs.diet}
              serverToday={todayKey()}
              readOnly
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
