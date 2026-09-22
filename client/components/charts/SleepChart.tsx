'use client';

import { Bar, BarChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame, TooltipBox } from '@/components/charts/ChartFrame';
import { RangeToggle, type RangeDays } from '@/components/charts/RangeToggle';
import { CHART_COLORS, SERIES_COLORS } from '@/lib/constants';
import { formatClock, formatDate, formatShortDate, formatSleepDuration } from '@/lib/format';
import type { SleepLog } from '@/lib/types';

/** The range most adults need each night (National Sleep Foundation). */
export const RECOMMENDED_SLEEP = { from: 7, to: 9 } as const;
const BAND_FILL = 'rgba(255, 255, 255, 0.06)';

interface SleepChartProps {
  /** Nights already narrowed to the chosen range, oldest first. */
  logs: SleepLog[];
  days: RangeDays;
  onDaysChange: (days: RangeDays) => void;
}

export function SleepChart({ logs, days, onDaysChange }: SleepChartProps) {
  const data = logs.map((log) => ({ ...log, hours: Math.round((log.durationMinutes / 60) * 100) / 100 }));
  const top = Math.max(10, Math.ceil(Math.max(...data.map((row) => row.hours), 0)) + 1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RangeToggle value={days} onChange={onDaysChange} />
        <p className="text-sm font-semibold text-muted">
          {logs.length} {logs.length === 1 ? 'night' : 'nights'} logged in the last {days} days
        </p>
      </div>

      <ChartFrame
        title="Sleep each night"
        subtitle={logs.length ? `${formatDate(logs[0]!.date)} → ${formatDate(logs.at(-1)!.date)}` : undefined}
        keys={[
          { label: 'Hours slept', color: SERIES_COLORS.sleep, kind: 'bar' },
          { label: 'Most adults need 7–9 h', color: BAND_FILL, kind: 'band' },
        ]}
        height="h-64"
        table={{
          caption: 'Sleep by night: bedtime, wake-up time and hours slept',
          head: ['Morning', 'Went to bed', 'Woke up', 'Slept'],
          rows: logs.map((log) => [
            formatDate(log.date),
            formatClock(log.bedtime),
            formatClock(log.wakeTime),
            formatSleepDuration(log.durationMinutes),
          ]),
        }}
      >
        {logs.length === 0 ? (
          <p className="grid h-full place-items-center rounded-xl bg-surface-2 text-sm text-muted">
            No nights logged in the last {days} days.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -4 }}>
              <ReferenceArea
                y1={RECOMMENDED_SLEEP.from}
                y2={RECOMMENDED_SLEEP.to}
                fill={BAND_FILL}
                fillOpacity={1}
                stroke="none"
                ifOverflow="hidden"
              />
              <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: CHART_COLORS.tick }}
                tickFormatter={formatShortDate}
                minTickGap={24}
              />
              <YAxis
                domain={[0, top]}
                ticks={Array.from({ length: Math.floor(top / 2) + 1 }, (_, index) => index * 2)}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fontSize: 12, fill: CHART_COLORS.tick }}
                tickFormatter={(value: number) => `${value}\u00a0h`}
              />
              <Tooltip
                cursor={{ fill: '#ffffff', fillOpacity: 0.05 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const log = payload[0]?.payload as SleepLog;
                  return (
                    <TooltipBox
                      label={`Morning of ${formatDate(log.date)}`}
                      rows={[
                        { name: 'Slept', value: formatSleepDuration(log.durationMinutes), color: SERIES_COLORS.sleep },
                        { name: 'Went to bed', value: formatClock(log.bedtime) },
                        { name: 'Woke up', value: formatClock(log.wakeTime) },
                      ]}
                    />
                  );
                }}
              />
              <Bar
                dataKey="hours"
                fill={SERIES_COLORS.sleep}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartFrame>
    </div>
  );
}
