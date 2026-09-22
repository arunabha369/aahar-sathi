import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CalendarRange, Droplets, PieChart, Sun } from 'lucide-react';
import { Panel, PanelHeader, PageHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MacroDonut, MacroLegend } from '@/components/charts/MacroDonut';
import { WeekCaloriesChart } from '@/components/charts/WeekCaloriesChart';
import { AdaptiveTargetCard } from '@/components/plan/AdaptiveTargetCard';
import { CalculationPanel } from '@/components/plan/CalculationPanel';
import { DayTabs } from '@/components/plan/DayTabs';
import { GeneratePlanButton } from '@/components/plan/GeneratePlanButton';
import { PlanActions } from '@/components/plan/PlanActions';
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

/** A titled band of the page, so the dashboard reads as a few clear parts. */
function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const id = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;
  return (
    <section aria-labelledby={id} className="mt-8 first:mt-0">
      <header className="mb-3 flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-brand-700 ring-1 ring-line">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-base font-bold text-ink">
            {title}
          </h2>
          {description ? <p className="text-[0.8125rem] text-muted">{description}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

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
        actions={<PlanActions plan={plan} serverToday={serverToday} />}
      />

      <div className="mb-5 empty:hidden">
        <AdaptiveTargetCard suggestion={suggestion} calories={plan.targets.calories} today={serverToday} compact />
      </div>

      {/* What matters right now: the next meal, what has been eaten, and today's water. */}
      <Section
        title="Today"
        description="Your next meal, what you have eaten, and your water."
        icon={<Sun className="size-4" aria-hidden="true" />}
      >
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
      </Section>

      {/* The days ahead: today's meals are already above, so this opens on tomorrow. */}
      <Section
        title="The week ahead"
        description="Pick any day to see its meals. Swap anything you do not fancy."
        icon={<CalendarRange className="size-4" aria-hidden="true" />}
      >
        <div className="grid gap-5 xl:grid-cols-3 xl:items-start">
          <Panel className="min-w-0 xl:col-span-2">
            <DayTabs
              planId={plan.id}
              days={plan.days}
              targets={plan.targets}
              diet={plan.inputs.diet}
              serverToday={serverToday}
              cityName={city}
              startDay="tomorrow"
            />
          </Panel>
          {/* Stays in view while a long day of meals scrolls past it. */}
          <Panel className="min-w-0 xl:sticky xl:top-6">
            <WeekCaloriesChart days={plan.days} targets={plan.targets} />
          </Panel>
        </div>
      </Section>

      <Section
        title="Your targets"
        description="What the plan is built to hit each day."
        icon={<PieChart className="size-4" aria-hidden="true" />}
      >
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="min-w-0 space-y-5 xl:col-span-2">
            <StatCards targets={plan.targets} />
            <CalculationPanel inputs={plan.inputs} targets={plan.targets} />
          </div>
          <Panel className="min-w-0">
            <MacroDonut targets={plan.targets} hideTitle />
            <MacroLegend targets={plan.targets} />
          </Panel>
        </div>
      </Section>

      <PrintGrocery groups={grocery.groups} total={grocery.total} />
    </div>
  );
}
