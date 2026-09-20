import { Droplets, Flame, Scale, Beef } from 'lucide-react';
import { BmiGauge, MacroBar } from '@/components/ui/DataBits';
import { BMI_BADGE } from '@/lib/constants';
import { litres } from '@/lib/format';
import type { Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

function Tile({
  label,
  icon,
  value,
  unit,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  unit?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="surface flex flex-col p-5" data-print="card">
      <div className="flex items-center gap-2">
        {icon}
        <p className="eyebrow">{label}</p>
      </div>
      <p className="mt-2.5 text-[2rem] font-extrabold leading-none tracking-tight text-ink tabular-nums">
        {value}
        {unit ? <span className="ml-1.5 text-sm font-bold text-muted">{unit}</span> : null}
      </p>
      {children ? <div className="mt-auto pt-4">{children}</div> : null}
    </div>
  );
}

export function StatCards({ targets }: { targets: Targets }) {
  const bmi = BMI_BADGE[targets.bmiCategory];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        label="Daily calories"
        icon={<Flame className="size-4 text-saffron-600" aria-hidden="true" />}
        value={targets.calories.toLocaleString('en-IN')}
        unit="kcal"
      >
        <p className="text-xs text-muted">
          Split across 5 meals — breakfast a quarter, lunch nearly a third.
        </p>
      </Tile>

      <Tile
        label="Your BMI"
        icon={<Scale className="size-4 text-brand-700" aria-hidden="true" />}
        value={targets.bmi.toFixed(1)}
      >
        <div>
          <span
            className={cn(
              'mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
              bmi.className,
            )}
          >
            {targets.bmiCategory}
          </span>
          <BmiGauge bmi={targets.bmi} />
          <p className="sr-only">{bmi.note}</p>
        </div>
      </Tile>

      <Tile
        label="Water target"
        icon={<Droplets className="size-4 text-water-600" aria-hidden="true" />}
        value={String(targets.waterGlasses)}
        unit="glasses"
      >
        <p className="text-xs text-muted">
          About <span className="font-bold text-ink">{litres(targets.waterGlasses)}</span> a day — one glass is
          250 ml.
        </p>
      </Tile>

      <Tile
        label="Protein target"
        icon={<Beef className="size-4 text-chilli-600" aria-hidden="true" />}
        value={String(targets.protein)}
        unit="g"
      >
        <MacroBar targets={targets} />
      </Tile>
    </div>
  );
}
