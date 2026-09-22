import type { Metadata } from 'next';
import { Droplets, PieChart } from 'lucide-react';
import { Panel, PanelHeader, PageHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MacroDonut, MacroLegend } from '@/components/charts/MacroDonut';
import { WeekCaloriesChart } from '@/components/charts/WeekCaloriesChart';
import { AdaptiveTargetCard } from '@/components/plan/AdaptiveTargetCard';
import { CalculationPanel } from '@/components/plan/CalculationPanel';
import { DayTabs } from '@/components/plan/DayTabs';
import { GeneratePlanButton } from '@/components/plan/GeneratePlanButton';
import { PlanActions } from '@/components/plan/PlanActions';
import { PlanEditorButton } from '@/components/plan/PlanEditor';
import { PrintGrocery } from '@/components/plan/PrintGrocery';
import { StatCards } from '@/components/plan/StatCards';
import { TodayCard } from '@/components/plan/TodayCard';
import { WaterTracker } from '@/components/plan/WaterTracker';
import { cityName } from '@/lib/api/cities';
import { serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import { DIET_OPTIONS, FASTING_LABELS, GOAL_OPTIONS } from '@/lib/constants';
import { addDays, todayKey } from '@/lib/format';
import type { ActivePlanResponse, AdjustmentResponse, DiaryDay, DiarySummary, GroceryResponse, WaterLogsResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false },
};

export default async function DashboardPage() {
  const user = await requireCompleteProfile();
  const { plan } = await serverFetch<ActivePlanResponse>('/plans/active');

  if (!plan) {
    return (
      <>
        <PageHeader
          eyebrow="Dashboard"
          title={`Namaste, ${user.name.split(' ')[0]}`}
          description="Your profile is ready — generate a plan and your week will appear here."
        />
        <EmptyState
          art="plate"
          title="No active plan yet"
          description="Generate a 7-day plan and your meals, targets and grocery list all land on this page."
          action={<GeneratePlanButton />}
        />
      </>
    );
  }

  const serverToday = todayKey();
  const [{ logs: waterLogs }, grocery, diary, summary, { suggestion }, city] = await Promise.all([
    serverFetch<WaterLogsResponse>(
      `/logs/water?from=${todayKey(addDays(new Date(), -14))}&to=${todayKey(addDays(new Date(), 1))}`,
    ),
    // Printing the plan should hand you the shopping list with it.
    serverFetch<GroceryResponse>(`/plans/${plan.id}/grocery`),
    serverFetch<DiaryDay>(`/diary/${serverToday}`),
    serverFetch<DiarySummary>(`/diary/summary?to=${serverToday}`),
    serverFetch<AdjustmentResponse>(`/profile/adjustment?today=${serverToday}`),
    cityName(plan.inputs.preferences?.city),
  ]);

  const goal = GOAL_OPTIONS.find((option) => option.value === plan.inputs.goal);
  const diet = DIET_OPTIONS.find((option) => option.value === plan.inputs.diet);
  const modes = [
    plan.inputs.preferences?.jain ? 'Jain' : null,
    FASTING_LABELS[plan.inputs.preferences?.fasting ?? 'none'],
    plan.inputs.household?.length ? `Household of ${plan.inputs.household.length + 1}` : null,
  ].filter(Boolean);

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow={[goal?.label, diet?.label, ...modes].filter(Boolean).join(' · ')}
        title={`Namaste, ${user.name.split(' ')[0]}`}
        description="Here is your plan for this week."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <PlanEditorButton
              target={{ kind: 'edit', planId: plan.id }}
              label="Edit plan"
              size="sm"
              className="no-print flex-1 sm:flex-none"
            />
            <PlanActions plan={plan} serverToday={serverToday} />
          </div>
        }
      />

      <div className="mb-5 empty:hidden">
        <AdaptiveTargetCard suggestion={suggestion} calories={plan.targets.calories} today={serverToday} compact />
      </div>

      {/* What matters right now: the next meal and today's water. */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <TodayCard
            days={plan.days}
            targets={plan.targets}
            serverToday={serverToday}
            diary={diary}
            streak={summary.streak}
          />
        </div>
        <Panel className="no-print">
          <PanelHeader
            eyebrow="Today"
            title="Water"
            icon={<Droplets className="size-[1.125rem] text-water-600" aria-hidden="true" />}
            description="Tap a glass to log it. Tap the last full glass to undo."
          />
          <WaterTracker target={plan.targets.waterGlasses} logs={waterLogs} serverToday={serverToday} />
        </Panel>
      </div>

      <div className="mt-5">
        <StatCards targets={plan.targets} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Panel>
            <PanelHeader
              eyebrow="This week"
              title="Your meals"
              description="Pick a day to see its meals. Swap anything you do not fancy."
            />
            <DayTabs
              planId={plan.id}
              days={plan.days}
              targets={plan.targets}
              diet={plan.inputs.diet}
              serverToday={serverToday}
              cityName={city}
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

      <PrintGrocery groups={grocery.groups} total={grocery.total} />
    </div>
  );
}
