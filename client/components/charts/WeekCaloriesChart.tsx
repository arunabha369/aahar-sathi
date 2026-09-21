'use client';

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame, TooltipBox } from '@/components/charts/ChartFrame';
import { CHART_COLORS, SERIES_COLORS } from '@/lib/constants';
import type { PlanDay, Targets } from '@/lib/types';

export function WeekCaloriesChart({ days, targets }: { days: PlanDay[]; targets: Targets }) {
  const data = days.map((day) => ({
    day: day.day,
    kcal: day.totals.kcal,
    protein: day.totals.protein,
  }));

  return (
    <ChartFrame
      title="Planned calories this week"
      subtitle="Each bar is one day of the plan"
      keys={[
        { label: 'Planned calories', color: SERIES_COLORS.calories, kind: 'bar' },
        { label: `Target ${targets.calories.toLocaleString('en-IN')} kcal`, color: CHART_COLORS.target, kind: 'line' },
      ]}
      height="h-64"
      table={{
        caption: 'Planned calories per day against the daily target',
        head: ['Day', 'Planned calories', 'Target'],
        rows: data.map((row) => [row.day, `${row.kcal} kcal`, `${targets.calories} kcal`]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="day" interval={0} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: CHART_COLORS.tick }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: CHART_COLORS.tick }}
            width={56}
            // Headroom above the tallest bar so the target label never lands on one.
            domain={[0, (max: number) => Math.ceil((Math.max(max, targets.calories) * 1.25) / 200) * 200]}
            tickFormatter={(value: number) => value.toLocaleString('en-IN')}
          />
          <ReferenceLine
            y={targets.calories}
            stroke={CHART_COLORS.target}
            strokeWidth={1}
          />
          <Tooltip
            cursor={{ fill: '#ffffff', fillOpacity: 0.05 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as (typeof data)[number];
              return (
                <TooltipBox
                  label={String(label)}
                  rows={[
                    { name: 'Planned', value: `${row.kcal.toLocaleString('en-IN')} kcal`, color: SERIES_COLORS.calories },
                    { name: 'Target', value: `${targets.calories.toLocaleString('en-IN')} kcal` },
                    { name: 'Protein', value: `${row.protein} g` },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="kcal" fill={SERIES_COLORS.calories} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
