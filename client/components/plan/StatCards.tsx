import type { ReactNode } from 'react';
import { Beef, Droplets, Flame, Scale } from 'lucide-react';
import { BmiGauge } from '@/components/ui/DataBits';
import { BMI_BADGE } from '@/lib/constants';
import { litres } from '@/lib/format';
import type { Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

function Stat({
  label,
  icon,
  value,
  unit,
  children,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  unit?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 p-4 sm:p-5">
      <dt className="flex items-center gap-1.5">
        {icon}
        <span className="eyebrow">{label}</span>
      </dt>
      <dd className="mt-2">
        <span className="text-[1.625rem] font-extrabold leading-none tracking-tight text-ink tabular-nums sm:text-[1.875rem]">
          {value}
        </span>
        {unit ? <span className="ml-1 text-sm font-bold text-muted">{unit}</span> : null}
        {children ? <div className="mt-2.5">{children}</div> : null}
      </dd>
    </div>
  );
}

/** The four numbers that define the plan, as one strip rather than four heavy cards. */
export function StatCards({ targets }: { targets: Targets }) {
  const bmi = BMI_BADGE[targets.bmiCategory];

  return (
    <section aria-labelledby="targets-heading" className="surface overflow-hidden" data-print="card">
      <h2 id="targets-heading" className="sr-only">
        Your daily targets
      </h2>
      <dl className="grid grid-cols-2 divide-line xl:grid-cols-4 [&>div:nth-child(odd)]:border-r [&>div:nth-child(odd)]:border-line [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(-n+2)]:border-line xl:[&>div]:border-b-0 xl:[&>div:not(:last-child)]:border-r">
        <Stat label="Calories" icon={<Flame className="size-4 text-saffron-600" aria-hidden="true" />} value={targets.calories.toLocaleString('en-IN')} unit="kcal">
          <p className="text-xs text-muted">a day, across 5 meals</p>
        </Stat>

        <Stat label="Protein" icon={<Beef className="size-4 text-chilli-600" aria-hidden="true" />} value={String(targets.protein)} unit="g">
          <p className="text-xs text-muted tabular-nums">
            {targets.carbs} g carbs · {targets.fat} g fat
          </p>
        </Stat>

        <Stat label="Water" icon={<Droplets className="size-4 text-water-600" aria-hidden="true" />} value={String(targets.waterGlasses)} unit="glasses">
          <p className="text-xs text-muted">
            about <span className="font-bold text-ink">{litres(targets.waterGlasses)}</span> a day
          </p>
        </Stat>

        <Stat label="BMI" icon={<Scale className="size-4 text-brand-700" aria-hidden="true" />} value={targets.bmi.toFixed(1)}>
          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ring-1 ring-inset', bmi.className)}>
            {targets.bmiCategory}
          </span>
          <span className="sr-only">. {bmi.note}.</span>
          <BmiGauge bmi={targets.bmi} className="mt-3" />
        </Stat>
      </dl>
    </section>
  );
}
