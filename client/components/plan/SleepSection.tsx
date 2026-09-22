'use client';

import { useState } from 'react';
import { BedDouble, Moon } from 'lucide-react';
import { RangeToggle, type RangeDays } from '@/components/charts/RangeToggle';
import { RECOMMENDED_SLEEP, SleepChart } from '@/components/charts/SleepChart';
import { SleepLogger } from '@/components/plan/SleepLogger';
import { Panel, PanelHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { addDays, averageBedtime, formatClock, formatSleepDuration, todayKey } from '@/lib/format';
import { useLocalToday } from '@/lib/useLocalToday';
import type { SleepLog } from '@/lib/types';

/**
 * Logger, summary and chart for sleep. The summary and the chart share one 7 / 30 / 90 day
 * range — change it on either and both follow — counted in calendar days, so skipped nights
 * don't stretch "30 days" into two months.
 */
export function SleepSection({ serverToday, logs }: { serverToday: string; logs: SleepLog[] }) {
  const today = useLocalToday(serverToday);
  const [days, setDays] = useState<RangeDays>(30);

  const since = todayKey(addDays(new Date(`${today}T00:00:00`), -(days - 1)));
  const inRange = logs.filter((log) => log.date >= since && log.date <= today);

  const average = inRange.length
    ? Math.round(inRange.reduce((sum, log) => sum + log.durationMinutes, 0) / inRange.length)
    : null;
  const bedtime = averageBedtime(inRange.map((log) => log.bedtime));
  const enough = inRange.filter(
    (log) => log.durationMinutes >= RECOMMENDED_SLEEP.from * 60 && log.durationMinutes <= RECOMMENDED_SLEEP.to * 60,
  ).length;

  return (
    <>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            eyebrow="This morning"
            title="Log last night’s sleep"
            icon={<BedDouble className="size-[1.125rem] text-sleep" aria-hidden="true" />}
            description="Bedtime and wake-up time are enough — the hours are worked out for you, even past midnight."
          />
          <SleepLogger serverToday={serverToday} logs={logs} />
        </Panel>

        <Panel>
          <PanelHeader eyebrow={`Last ${days} days`} title="Sleep" className="mb-4" />
          <RangeToggle value={days} onChange={setDays} className="mb-5" />

          {logs.length === 0 ? (
            <p className="text-sm text-muted">Log a night of sleep to see your average here.</p>
          ) : average === null ? (
            <p className="text-sm text-muted">No nights logged in the last {days} days.</p>
          ) : (
            <div aria-live="polite">
              <p className="text-[2rem] font-extrabold leading-none tracking-tight text-ink">
                {formatSleepDuration(average)}
                <span className="ml-1.5 text-sm font-bold text-muted">a night</span>
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Nights logged</dt>
                  <dd className="font-semibold text-ink tabular-nums">
                    {inRange.length} of {days}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">In the 7–9 h range</dt>
                  <dd className="font-semibold text-ink tabular-nums">
                    {enough} of {inRange.length}
                  </dd>
                </div>
                {bedtime ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Usual bedtime</dt>
                    <dd className="font-semibold text-ink tabular-nums">{formatClock(bedtime)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-5">
        <Panel>
          {logs.length === 0 ? (
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
            <SleepChart logs={inRange} days={days} onDaysChange={setDays} />
          )}
        </Panel>
      </div>
    </>
  );
}
