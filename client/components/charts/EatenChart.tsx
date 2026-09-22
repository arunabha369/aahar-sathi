'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame, TooltipBox } from '@/components/charts/ChartFrame';
import { RangeToggle, type RangeDays } from '@/components/charts/RangeToggle';
import { CHART_COLORS, SERIES_COLORS } from '@/lib/constants';
import { formatDate, formatShortDate } from '@/lib/format';
import type { DiaryDaySummary } from '@/lib/types';

const logged = (day: DiaryDaySummary) => day.eatenMeals + day.skippedMeals + day.swappedMeals + day.entries > 0;

/** Calories actually eaten each day, against the daily target. Unlogged days are gaps, not zeros. */
export function EatenChart({ days, target }: { days: DiaryDaySummary[]; target: number }) {
  const [range, setRange] = useState<RangeDays>(30);
  const visible = days.slice(-range);
  const data = visible.map((day) => ({ ...day, eaten: logged(day) ? day.kcal : null }));
  const loggedDays = visible.filter(logged);
  const average = loggedDays.length ? Math.round(loggedDays.reduce((sum, day) => sum + day.kcal, 0) / loggedDays.length) : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RangeToggle value={range} onChange={setRange} />
        <p className="text-sm font-semibold text-muted">
          {loggedDays.length} of {range} days logged{average !== null ? ` · average ${average.toLocaleString('en-IN')} kcal` : ''}
        </p>
      </div>

      <ChartFrame
        title="Calories eaten"
        subtitle="From your food diary — ticked-off meals plus everything else you logged"
        keys={[
          { label: 'Eaten', color: SERIES_COLORS.calories, kind: 'bar' },
          { label: `Target ${target.toLocaleString('en-IN')} kcal`, color: CHART_COLORS.target, kind: 'line' },
        ]}
        height="h-64"
        table={{
          caption: 'Calories eaten per day against the target',
          head: ['Date', 'Eaten', 'Target'],
          rows: visible.map((day) => [formatDate(day.date), logged(day) ? `${day.kcal} kcal` : 'Not logged', `${target} kcal`]),
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -4 }}>
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
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 12, fill: CHART_COLORS.tick }}
              domain={[0, (max: number) => Math.ceil((Math.max(max, target) * 1.2) / 500) * 500]}
              tickFormatter={(value: number) => value.toLocaleString('en-IN')}
            />
            <ReferenceLine y={target} stroke={CHART_COLORS.target} strokeWidth={1} />
            <Tooltip
              cursor={{ fill: '#ffffff', fillOpacity: 0.05 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const day = payload[0]?.payload as DiaryDaySummary & { eaten: number | null };
                return (
                  <TooltipBox
                    label={formatDate(day.date)}
                    rows={
                      day.eaten === null
                        ? [{ name: 'Eaten', value: 'Not logged' }]
                        : [
                            { name: 'Eaten', value: `${day.kcal.toLocaleString('en-IN')} kcal`, color: SERIES_COLORS.calories },
                            { name: 'Planned meals', value: `${day.eatenMeals} eaten · ${day.skippedMeals} skipped · ${day.swappedMeals} swapped` },
                            { name: 'Other foods', value: String(day.entries) },
                          ]
                    }
                  />
                );
              }}
            />
            <Bar dataKey="eaten" fill={SERIES_COLORS.calories} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
