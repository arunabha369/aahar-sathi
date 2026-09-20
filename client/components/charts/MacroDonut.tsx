'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartFrame, TooltipBox } from '@/components/charts/ChartFrame';
import { MACRO_COLORS } from '@/lib/constants';
import type { Targets } from '@/lib/types';

interface Slice {
  name: string;
  grams: number;
  kcal: number;
  color: string;
}

export function MacroDonut({ targets, hideTitle = false }: { targets: Targets; hideTitle?: boolean }) {
  const slices: Slice[] = [
    { name: 'Protein', grams: targets.protein, kcal: targets.protein * 4, color: MACRO_COLORS.protein },
    { name: 'Carbs', grams: targets.carbs, kcal: targets.carbs * 4, color: MACRO_COLORS.carbs },
    { name: 'Fat', grams: targets.fat, kcal: targets.fat * 9, color: MACRO_COLORS.fat },
  ];
  const totalKcal = slices.reduce((sum, slice) => sum + slice.kcal, 0);
  const share = (slice: Slice) => Math.round((slice.kcal / totalKcal) * 100);

  return (
    <ChartFrame
      title="Where your calories come from"
      hideTitle={hideTitle}
      subtitle={`${targets.calories.toLocaleString('en-IN')} kcal a day across the three macros`}
      height="h-56"
      table={{
        caption: 'Daily macro targets',
        head: ['Macro', 'Grams', 'Calories', 'Share'],
        rows: slices.map((slice) => [slice.name, `${slice.grams} g`, `${slice.kcal} kcal`, `${share(slice)}%`]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="kcal"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="#ffffff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const slice = payload[0]?.payload as Slice;
              return (
                <TooltipBox
                  label={slice.name}
                  rows={[
                    { name: 'Per day', value: `${slice.grams} g`, color: slice.color },
                    { name: 'Calories', value: `${slice.kcal} kcal` },
                    { name: 'Share', value: `${share(slice)}%` },
                  ]}
                />
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function MacroLegend({ targets }: { targets: Targets }) {
  const items = [
    { name: 'Protein', grams: targets.protein, color: MACRO_COLORS.protein },
    { name: 'Carbs', grams: targets.carbs, color: MACRO_COLORS.carbs },
    { name: 'Fat', grams: targets.fat, color: MACRO_COLORS.fat },
  ];

  return (
    <ul className="mt-4 grid grid-cols-3 gap-2">
      {items.map((item) => (
        <li key={item.name} className="rounded-xl bg-canvas px-3 py-2.5 text-center ring-1 ring-line">
          <span className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
            {item.name}
          </span>
          <span className="mt-1 block text-lg font-extrabold text-ink tabular-nums">{item.grams} g</span>
        </li>
      ))}
    </ul>
  );
}
