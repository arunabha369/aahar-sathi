import { ChevronDown, Info } from 'lucide-react';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from '@/lib/constants';
import { litres } from '@/lib/format';
import type { Profile, Targets } from '@/lib/types';

function Row({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-[0.875rem] font-semibold text-ink">{label}</p>
        {detail ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{detail}</p> : null}
      </div>
      <p className="shrink-0 text-[0.875rem] font-extrabold text-ink tabular-nums">{value}</p>
    </div>
  );
}

export function CalculationPanel({ inputs, targets }: { inputs: Profile; targets: Targets }) {
  const activity = ACTIVITY_OPTIONS.find((option) => option.value === inputs.activity);
  const goal = GOAL_OPTIONS.find((option) => option.value === inputs.goal);
  const goalDelta = inputs.goal === 'loss' ? '− 500 kcal' : inputs.goal === 'gain' ? '+ 300 kcal' : 'no change';

  return (
    <details className="surface group overflow-hidden p-0" data-print="card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-brand-700 ring-1 ring-line">
            <Info className="size-[1.125rem]" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink sm:text-lg">How we calculated this</h2>
            <p className="mt-0.5 text-sm text-muted">Every number on this page, step by step.</p>
          </div>
        </div>
        <ChevronDown
          className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t border-line px-5 pb-6 pt-2 sm:px-6">
        <h3 className="eyebrow mt-4">Your daily calories</h3>
        <div className="mt-1">
          <Row
            label="BMR — what your body burns at rest"
            detail={`Mifflin–St Jeor for ${inputs.gender === 'male' ? 'men' : 'women'}: 10 × ${inputs.weightKg} kg + 6.25 × ${inputs.heightCm} cm − 5 × ${inputs.age} ${inputs.gender === 'male' ? '+ 5' : '− 161'}`}
            value={`${targets.bmr.toLocaleString('en-IN')} kcal`}
          />
          <Row
            label={`× ${activity?.label ?? 'Activity'} (×${activity?.multiplier ?? ''})`}
            {...(activity?.description ? { detail: activity.description } : {})}
            value={`TDEE ${targets.tdee.toLocaleString('en-IN')} kcal`}
          />
          <Row
            label={`${goal?.label ?? 'Goal'} adjustment`}
            {...(goal?.description ? { detail: goal.description } : {})}
            value={goalDelta}
          />
          <Row label="Your daily target" value={`${targets.calories.toLocaleString('en-IN')} kcal`} />
        </div>

        {targets.notes.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {targets.notes.map((note) => (
              <li
                key={note}
                className="flex gap-2.5 rounded-xl bg-saffron-50 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-saffron-800 ring-1 ring-inset ring-saffron-200"
              >
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {note}
              </li>
            ))}
          </ul>
        ) : null}

        <h3 className="eyebrow mt-7">Your macros</h3>
        <div className="mt-1">
          <Row
            label="Protein"
            detail={`${inputs.goal === 'loss' ? '1.4' : inputs.goal === 'gain' ? '1.6' : '1.0'} g per kg of reference weight — the lower of your weight and a BMI-25 weight`}
            value={`${targets.protein} g`}
          />
          <Row label="Fat" detail="25% of your daily calories, divided by 9 kcal per gram" value={`${targets.fat} g`} />
          <Row label="Carbs" detail="Whatever calories are left, divided by 4 kcal per gram" value={`${targets.carbs} g`} />
          <Row
            label="Water"
            detail={`35 ml per kg${inputs.activity === 'active' || inputs.activity === 'athlete' ? ', plus 500 ml because you train hard' : ''}, rounded up to 250 ml glasses`}
            value={`${targets.waterGlasses} glasses (${litres(targets.waterGlasses)})`}
          />
          <Row
            label="BMI"
            detail={`${inputs.weightKg} kg ÷ (${(inputs.heightCm / 100).toFixed(2)} m)², classified with Asian-Indian cut-offs of 23 and 25`}
            value={`${targets.bmi.toFixed(1)} · ${targets.bmiCategory}`}
          />
        </div>
      </div>
    </details>
  );
}
