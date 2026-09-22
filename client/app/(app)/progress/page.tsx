import type { Metadata } from 'next';
import { BedDouble, LineChart, Moon, Scale } from 'lucide-react';
import { Panel, PanelHeader, PageHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SleepChart } from '@/components/charts/SleepChart';
import { WaterChart } from '@/components/charts/WaterChart';
import { WeightChart } from '@/components/charts/WeightChart';
import { SleepLogger } from '@/components/plan/SleepLogger';
import { WeightLogger } from '@/components/plan/WeightLogger';
import { serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import { addDays, averageBedtime, formatClock, formatSleepDuration, todayKey } from '@/lib/format';
import type { ActivePlanResponse, SleepLogsResponse, WaterLogsResponse, WeightLogsResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Progress',
  robots: { index: false },
};

export default async function ProgressPage() {
  const user = await requireCompleteProfile();
  const serverToday = todayKey();
  const from = todayKey(addDays(new Date(), -120));
  const to = todayKey(addDays(new Date(), 1));

  const [{ logs: weightLogs }, { logs: waterLogs }, { logs: sleepLogs }, { plan }] = await Promise.all([
    serverFetch<WeightLogsResponse>(`/logs/weight?from=${from}&to=${to}`),
    serverFetch<WaterLogsResponse>(`/logs/water?from=${from}&to=${to}`),
    serverFetch<SleepLogsResponse>(`/logs/sleep?from=${from}&to=${to}`),
    serverFetch<ActivePlanResponse>('/plans/active'),
  ]);

  const waterTarget = plan?.targets.waterGlasses ?? 8;
  const startWeight = user.profile.weightKg;
  const latest = weightLogs.at(-1);
  const change = latest && startWeight ? latest.weightKg - startWeight : null;

  // The last seven nights logged, for the sleep summary.
  const lastWeek = sleepLogs.slice(-7);
  const averageSleep = lastWeek.length
    ? Math.round(lastWeek.reduce((sum, log) => sum + log.durationMinutes, 0) / lastWeek.length)
    : null;
  const usualBedtime = averageBedtime(lastWeek.map((log) => log.bedtime));

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Tracking"
        title="Progress"
        description="Log your weight and last night’s sleep each morning — first thing is the most consistent time."
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

      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            eyebrow="This morning"
            title="Log last night’s sleep"
            icon={<BedDouble className="size-[1.125rem] text-sleep" aria-hidden="true" />}
            description="Bedtime and wake-up time are enough — the hours are worked out for you, even past midnight."
          />
          <SleepLogger serverToday={serverToday} logs={sleepLogs} />
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Last 7 nights" title="Sleep" />
          {averageSleep === null ? (
            <p className="text-sm text-muted">Log a night of sleep to see your average here.</p>
          ) : (
            <div>
              <p className="text-[2rem] font-extrabold leading-none tracking-tight text-ink">
                {formatSleepDuration(averageSleep)}
                <span className="ml-1.5 text-sm font-bold text-muted">a night</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {usualBedtime ? `Usually in bed by ${formatClock(usualBedtime)}. ` : ''}
                Most adults need 7–9 hours.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-5 space-y-5">
        <Panel>
          {sleepLogs.length === 0 ? (
            <>
              <PanelHeader
                eyebrow="Trend"
                title="Sleep"
                icon={<Moon className="size-[1.125rem] text-sleep" aria-hidden="true" />}
              />
              <EmptyState
                art="sleep"
                title="No sleep logged yet"
                description="Log last night above and each night will appear here as a bar, against the 7–9 hour range."
              />
            </>
          ) : (
            <SleepChart logs={sleepLogs} />
          )}
        </Panel>

        <Panel>
          <WaterChart logs={waterLogs} target={waterTarget} />
        </Panel>
      </div>
    </div>
  );
}
