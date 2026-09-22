'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame, TooltipBox } from '@/components/charts/ChartFrame';
import { CHART_COLORS, SERIES_COLORS } from '@/lib/constants';
import { averageBedtime, formatClock, formatDate, formatShortDate, formatSleepDuration } from '@/lib/format';
import type { SleepLog } from '@/lib/types';
import { cn } from '@/lib/utils';

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

/** The range most adults need each night (National Sleep Foundation). */
const RECOMMENDED = { from: 7, to: 9 } as const;
const BAND_FILL = 'rgba(255, 255, 255, 0.06)';

export function SleepChart({ logs }: { logs: SleepLog[] }) {
  const [days, setDays] = useState(30);
  const visible = logs.slice(-days);
  const data = visible.map((log) => ({ ...log, hours: Math.round((log.durationMinutes / 60) * 100) / 100 }));

  const average = visible.length
    ? Math.round(visible.reduce((sum, log) => sum + log.durationMinutes, 0) / visible.length)
    : 0;
  const bedtime = averageBedtime(visible.map((log) => log.bedtime));
  const inRange = visible.filter(
    (log) => log.durationMinutes >= RECOMMENDED.from * 60 && log.durationMinutes <= RECOMMENDED.to * 60,
  ).length;
  const top = Math.max(10, Math.ceil(Math.max(...data.map((row) => row.hours), 0)) + 1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-canvas p-0.5 ring-1 ring-line" role="group" aria-label="Time range">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              aria-pressed={days === range.days}
              className={cn(
                'min-h-11 rounded-md px-4 text-xs font-bold transition-colors',
                days === range.days ? 'bg-surface-3 text-ink ring-1 ring-line-strong' : 'text-muted hover:text-ink',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
        {visible.length ? (
          <p className="text-sm font-semibold text-muted">
            {inRange} of {visible.length} {visible.length === 1 ? 'night' : 'nights'} in the 7–9 h range
          </p>
        ) : null}
      </div>

      <ChartFrame
        title="Sleep each night"
        subtitle={
          visible.length
            ? `Average ${formatSleepDuration(average)} a night${bedtime ? ` · usually in bed by ${formatClock(bedtime)}` : ''}`
            : undefined
        }
        keys={[
          { label: 'Hours slept', color: SERIES_COLORS.sleep, kind: 'bar' },
          { label: 'Most adults need 7–9 h', color: BAND_FILL, kind: 'band' },
        ]}
        height="h-64"
        table={{
          caption: 'Sleep by night: bedtime, wake-up time and hours slept',
          head: ['Morning', 'Went to bed', 'Woke up', 'Slept'],
          rows: visible.map((log) => [
            formatDate(log.date),
            formatClock(log.bedtime),
            formatClock(log.wakeTime),
            formatSleepDuration(log.durationMinutes),
          ]),
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -4 }}>
            <ReferenceArea y1={RECOMMENDED.from} y2={RECOMMENDED.to} fill={BAND_FILL} fillOpacity={1} stroke="none" ifOverflow="hidden" />
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
            <Bar dataKey="hours" fill={SERIES_COLORS.sleep} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
