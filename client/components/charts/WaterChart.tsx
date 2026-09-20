'use client';

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame, TooltipBox } from '@/components/charts/ChartFrame';
import { SERIES_COLORS } from '@/lib/constants';
import { addDays, formatDate, formatShortDate, todayKey } from '@/lib/format';
import type { WaterLog } from '@/lib/types';

/** Fills in the days with no entry so the last two weeks are always 14 bars. */
function lastFourteenDays(logs: WaterLog[]): WaterLog[] {
  const byDate = new Map(logs.map((log) => [log.date, log.glasses]));
  return Array.from({ length: 14 }, (_, index) => {
    const date = todayKey(addDays(new Date(), index - 13));
    return { date, glasses: byDate.get(date) ?? 0 };
  });
}

export function WaterChart({ logs, target }: { logs: WaterLog[]; target: number }) {
  const data = lastFourteenDays(logs);
  const metTarget = data.filter((day) => day.glasses >= target).length;

  return (
    <ChartFrame
      title="Water over the last 14 days"
      subtitle={`Goal hit on ${metTarget} of the last 14 days`}
      keys={[
        { label: 'Glasses logged', color: SERIES_COLORS.water, kind: 'bar' },
        { label: `Target ${target} glasses`, color: '#0E1A16', kind: 'line' },
      ]}
      height="h-64"
      table={{
        caption: 'Glasses of water logged per day against the daily target',
        head: ['Date', 'Glasses', 'Target'],
        rows: data.map((day) => [formatDate(day.date), day.glasses, target]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="#E9EEEB" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#5F6F69' }}
            tickFormatter={formatShortDate}
            minTickGap={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
            domain={[0, (max: number) => Math.max(max, target) + 2]}
            tick={{ fontSize: 12, fill: '#5F6F69' }}
          />
          <ReferenceLine
            y={target}
            stroke="#0E1A16"
            strokeWidth={1}
          />
          <Tooltip
            cursor={{ fill: '#0E1A16', fillOpacity: 0.04 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const day = payload[0]?.payload as WaterLog;
              return (
                <TooltipBox
                  label={formatDate(day.date)}
                  rows={[
                    { name: 'Logged', value: `${day.glasses} glasses`, color: SERIES_COLORS.water },
                    { name: 'Target', value: `${target} glasses` },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="glasses" fill={SERIES_COLORS.water} radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
