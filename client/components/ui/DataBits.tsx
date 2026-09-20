import { MACRO_COLORS } from '@/lib/constants';
import type { BmiCategory, Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

const BMI_BANDS: { label: BmiCategory; from: number; to: number; color: string }[] = [
  { label: 'Underweight', from: 15, to: 18.5, color: '#FDB022' },
  { label: 'Normal', from: 18.5, to: 23, color: '#12B76A' },
  { label: 'Overweight', from: 23, to: 25, color: '#F79009' },
  { label: 'Obese', from: 25, to: 40, color: '#F04438' },
];

const SCALE_MIN = 15;
const SCALE_MAX = 40;
const position = (bmi: number) => ((Math.min(SCALE_MAX, Math.max(SCALE_MIN, bmi)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

/** A BMI scale with the Asian-Indian cut-offs drawn in, and a marker for this user. */
export function BmiGauge({ bmi, className }: { bmi: number; className?: string }) {
  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-canvas">
        <div className="flex h-full w-full">
          {BMI_BANDS.map((band) => (
            <span
              key={band.label}
              className="h-full"
              style={{
                width: `${((band.to - band.from) / (SCALE_MAX - SCALE_MIN)) * 100}%`,
                backgroundColor: band.color,
              }}
            />
          ))}
        </div>
      </div>
      <div className="relative h-0">
        <span
          aria-hidden="true"
          className="absolute -top-[1.05rem] size-4 -translate-x-1/2 rounded-full border-[3px] border-white bg-ink shadow-sm"
          style={{ left: `${position(bmi)}%` }}
        />
      </div>
      <div className="mt-2.5 flex justify-between text-[0.625rem] font-semibold text-muted">
        <span>15</span>
        <span>18.5</span>
        <span>23</span>
        <span>25</span>
        <span>40</span>
      </div>
    </div>
  );
}

/** Protein / carbs / fat as one bar, separated by surface-coloured gaps. */
export function MacroBar({ targets, className }: { targets: Targets; className?: string }) {
  const kcal = {
    protein: targets.protein * 4,
    carbs: targets.carbs * 4,
    fat: targets.fat * 9,
  };
  const total = kcal.protein + kcal.carbs + kcal.fat || 1;

  const segments = [
    { key: 'Protein', value: kcal.protein, color: MACRO_COLORS.protein, grams: targets.protein },
    { key: 'Carbs', value: kcal.carbs, color: MACRO_COLORS.carbs, grams: targets.carbs },
    { key: 'Fat', value: kcal.fat, color: MACRO_COLORS.fat, grams: targets.fat },
  ];

  return (
    <div className={cn('w-full', className)}>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-muted">
            <span className="size-2 rounded-full" style={{ backgroundColor: segment.color }} aria-hidden="true" />
            {segment.key} {segment.grams} g
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A compact ring for "how much of the day is planned". */
export function ProgressRing({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label?: string;
  className?: string;
}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('size-16', className)}>
      <circle cx="32" cy="32" r={radius} fill="none" stroke="#EEF1EF" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="#027A48"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${circumference * ratio} ${circumference}`}
        transform="rotate(-90 32 32)"
      />
      {label ? (
        <text x="32" y="36" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0E1A16">
          {label}
        </text>
      ) : null}
    </svg>
  );
}
