import type { Metadata } from 'next';
import { LineChart, Scale } from 'lucide-react';
import { Panel, PanelHeader, PageHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { WaterChart } from '@/components/charts/WaterChart';
import { WeightChart } from '@/components/charts/WeightChart';
import { WeightLogger } from '@/components/plan/WeightLogger';
import { serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import { addDays, todayKey } from '@/lib/format';
import type { ActivePlanResponse, WaterLogsResponse, WeightLogsResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Progress',
  robots: { index: false },
};

export default async function ProgressPage() {
  const user = await requireCompleteProfile();
  const serverToday = todayKey();
  const from = todayKey(addDays(new Date(), -120));
  const to = todayKey(addDays(new Date(), 1));

  const [{ logs: weightLogs }, { logs: waterLogs }, { plan }] = await Promise.all([
    serverFetch<WeightLogsResponse>(`/logs/weight?from=${from}&to=${to}`),
    serverFetch<WaterLogsResponse>(`/logs/water?from=${from}&to=${to}`),
    serverFetch<ActivePlanResponse>('/plans/active'),
  ]);

  const waterTarget = plan?.targets.waterGlasses ?? 8;
  const startWeight = user.profile.weightKg;
  const latest = weightLogs.at(-1);
  const change = latest && startWeight ? latest.weightKg - startWeight : null;

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Tracking"
        title="Progress"
        description="Log your weight once a day — first thing in the morning is the most consistent time."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            eyebrow="Today"
            title="Log your weight"
            icon={<Scale className="size-[1.125rem] text-brand-700" aria-hidden="true" />}
            description="Small ups and downs are normal; the trend over weeks is what counts."
          />
          <WeightLogger serverToday={serverToday} logs={weightLogs} />
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Since you started" title="Change" />
          {change === null ? (
            <p className="text-sm text-muted">Log your weight to see how far you have come.</p>
          ) : (
            <div>
              <p className="text-[2rem] font-extrabold leading-none tracking-tight text-ink tabular-nums">
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}
                <span className="ml-1.5 text-sm font-bold text-muted">kg</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Profile weight {startWeight} kg · latest logged {latest?.weightKg} kg across{' '}
                {weightLogs.length} logged {weightLogs.length === 1 ? 'day' : 'days'}.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-5 space-y-5">
        <Panel>
          {weightLogs.length === 0 ? (
            <>
              <PanelHeader
                eyebrow="Trend"
                title="Weight"
                icon={<LineChart className="size-[1.125rem] text-brand-700" aria-hidden="true" />}
              />
              <EmptyState
                art="trend"
                title="No weight logged yet"
                description="Log your weight above and your trend line will start here. A few days is enough to see a direction."
              />
            </>
          ) : (
            <WeightChart logs={weightLogs} />
          )}
        </Panel>

        <Panel>
          <WaterChart logs={waterLogs} target={waterTarget} />
        </Panel>
      </div>
    </div>
  );
}
