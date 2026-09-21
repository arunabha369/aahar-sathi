import type { BmiCategory } from '@/lib/types';
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
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
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
          className="absolute -top-[1.05rem] size-4 -translate-x-1/2 rounded-full border-[3px] border-surface bg-ink shadow-sm"
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
