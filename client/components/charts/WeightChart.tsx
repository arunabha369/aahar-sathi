'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame, TooltipBox } from '@/components/charts/ChartFrame';
import { CHART_COLORS, SERIES_COLORS } from '@/lib/constants';
import { formatDate, formatShortDate } from '@/lib/format';
import type { WeightLog } from '@/lib/types';
import { cn } from '@/lib/utils';

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

export function WeightChart({ logs }: { logs: WeightLog[] }) {
  const [days, setDays] = useState(30);
  const visible = logs.slice(-days);

  const weights = visible.map((log) => log.weightKg);
  const min = weights.length ? Math.floor(Math.min(...weights) - 1) : 0;
  const max = weights.length ? Math.ceil(Math.max(...weights) + 1) : 100;
  const change = weights.length > 1 ? (weights.at(-1) ?? 0) - (weights[0] ?? 0) : 0;

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
        {weights.length > 1 ? (
          <p className="text-sm font-semibold text-muted">
            {change === 0
              ? 'No change over this period'
              : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg over ${visible.length} logged days`}
          </p>
        ) : null}
      </div>

      <ChartFrame
        title="Weight trend"
        subtitle={visible.length ? `${formatDate(visible[0]!.date)} → ${formatDate(visible.at(-1)!.date)}` : undefined}
        height="h-64"
        table={{
          caption: 'Logged weight by date',
          head: ['Date', 'Weight'],
          rows: visible.map((log) => [formatDate(log.date), `${log.weightKg} kg`]),
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}>
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
              domain={[min, max]}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 12, fill: CHART_COLORS.tick }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const log = payload[0]?.payload as WeightLog;
                return (
                  <TooltipBox
                    label={formatDate(log.date)}
                    rows={[{ name: 'Weight', value: `${log.weightKg} kg`, color: SERIES_COLORS.weight }]}
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke={SERIES_COLORS.weight}
              strokeWidth={2}
              strokeLinecap="round"
              dot={{ r: 4, fill: SERIES_COLORS.weight, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: SERIES_COLORS.weight, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
