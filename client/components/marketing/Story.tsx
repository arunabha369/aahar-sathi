import { Check, X } from 'lucide-react';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { COMPARISON, DEMO } from '@/components/marketing/content';
import { cn } from '@/lib/utils';

export function ProblemSolution() {
  return (
    <section aria-labelledby="why-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionIntro id="why-heading" eyebrow="Why Aahar Sathi" title="Most diet charts were never written for an Indian kitchen.">
        They assume foods you do not cook, weights you cannot measure, and a body that is not yours.
      </SectionIntro>

      <div className="reveal mt-12 overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="hidden grid-cols-2 border-b border-line bg-canvas text-[0.8125rem] font-bold uppercase tracking-[0.1em] sm:grid">
          <p className="px-6 py-4 text-muted">The usual diet chart</p>
          <p className="border-l border-line px-6 py-4 text-brand-700">Aahar Sathi</p>
        </div>
        <ul className="divide-y divide-line">
          {COMPARISON.map((row) => (
            <li key={row.problem} className="grid sm:grid-cols-2">
              <p className="flex gap-3 px-6 pb-2 pt-5 text-[0.9375rem] text-muted sm:py-5">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-chilli-50 text-chilli-600">
                  <X className="size-3" strokeWidth={3.5} aria-hidden="true" />
                </span>
                <span>
                  <span className="sr-only">The usual diet chart: </span>
                  {row.problem}
                </span>
              </p>
              <p className="flex gap-3 px-6 pb-5 pt-2 text-[0.9375rem] font-semibold text-ink sm:border-l sm:border-line sm:py-5">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-800">
                  <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                </span>
                <span>
                  <span className="sr-only">Aahar Sathi: </span>
                  {row.answer}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- How it works: small, crisp renderings of the real UI ---------------- */

function MiniField({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <p className="text-[0.6875rem] font-semibold text-muted">{label}</p>
      <p className="mt-1 flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink">
        {value}
        <span className="text-xs font-semibold text-muted">{unit}</span>
      </p>
    </div>
  );
}

function ProfileMock() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <MiniField label="Age" value="29" unit="yrs" />
        <MiniField label="Weight" value="74" unit="kg" />
        <MiniField label="Height" value="175" unit="cm" />
      </div>
      <div>
        <p className="text-[0.6875rem] font-semibold text-muted">Activity</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {['Light', 'Moderate', 'Active'].map((level) => (
            <span
              key={level}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-bold',
                level === 'Moderate' ? 'bg-accent text-accent-ink' : 'border border-line bg-surface-2 text-ink-soft',
              )}
            >
              {level}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MathsMock() {
  const rows = [
    { label: 'Resting energy (BMR)', value: DEMO.bmr.toLocaleString('en-IN') },
    { label: `× ${DEMO.multiplier} for moderate activity`, value: DEMO.tdee.toLocaleString('en-IN') },
    { label: `− ${DEMO.deficit} for weight loss`, value: `−${DEMO.deficit}` },
  ];
  return (
    <div className="font-medium">
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
            <span className="text-muted">{row.label}</span>
            <span className="font-bold text-ink tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-baseline justify-between gap-3 rounded-xl bg-accent px-3.5 py-2.5 text-accent-ink">
        <span className="text-[0.8125rem] font-semibold">Your daily target</span>
        <span className="text-lg font-extrabold tabular-nums">
          {DEMO.calories.toLocaleString('en-IN')} <span className="text-xs font-bold">kcal</span>
        </span>
      </p>
    </div>
  );
}

function WeekMock() {
  const week = [
    ['Mon', 2154], ['Tue', 2118], ['Wed', 2155], ['Thu', 2118], ['Fri', 2138], ['Sat', 2125], ['Sun', 2093],
  ] as const;
  return (
    <div className="flex items-end justify-between gap-1.5">
      {week.map(([day, kcal], index) => (
        <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
          <span
            className={cn('w-full rounded-md', index === 0 ? 'bg-accent' : 'bg-brand-200')}
            style={{ height: `${Math.round(((kcal - 1900) / 300) * 72) + 18}px` }}
          />
          <span className={cn('text-[0.6875rem] font-bold', index === 0 ? 'text-brand-800' : 'text-muted')}>{day}</span>
        </div>
      ))}
    </div>
  );
}

const STEPS = [
  {
    title: 'Tell us about you',
    body: 'Age, height, weight, how active your week is, and what you eat. About a minute, with a sensible range on every field.',
    Mock: ProfileMock,
  },
  {
    title: 'We do the maths',
    body: 'Your resting energy, times your activity, adjusted for your goal — plus protein, carbs, fat and water. Every step is shown.',
    Mock: MathsMock,
  },
  {
    title: 'Cook your week',
    body: 'Seven days of meals, each day within a few percent of your target, with a grocery list and trackers to match.',
    Mock: WeekMock,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro id="how-heading" eyebrow="How it works" title="From your numbers to your thali in three steps." />

        <ol className="mt-14 grid gap-6 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="reveal flex flex-col">
              <div aria-hidden="true" className="flex min-h-[11.5rem] flex-col justify-center rounded-2xl border border-line bg-canvas p-5">
                <step.Mock />
              </div>
              <div className="mt-6 flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-accent-ink">
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold text-ink">{step.title}</h3>
              </div>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
