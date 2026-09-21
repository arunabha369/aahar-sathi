import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { DemoButton } from '@/components/DemoButton';
import { MACRO_COLORS } from '@/lib/constants';
import { DEMO } from '@/components/marketing/content';

const TODAY = [
  // Base dish kcal × the app's quarter-step portion factor, as the plan generator scales them.
  { slug: 'poha-peanuts', slot: 'Breakfast', time: '7:00', name: 'Poha with peanuts', portion: '1¼ bowls', kcal: 514 },
  { slug: 'rajma-chawal', slot: 'Lunch', time: '1:00', name: 'Rajma chawal', portion: '1¼ bowls · 2 bowls rice', kcal: 650 },
  { slug: 'palak-paneer-roti', slot: 'Dinner', time: '7:30', name: 'Palak paneer', portion: '1 bowl · 3 rotis', kcal: 605 },
];

/** A static rendering of the real dashboard card, so visitors see the product first. */
function PlanCard() {
  const macroKcal = DEMO.protein * 4 + DEMO.carbs * 4 + DEMO.fat * 9;
  const bars = [
    { label: 'Protein', grams: DEMO.protein, kcal: DEMO.protein * 4, color: MACRO_COLORS.protein },
    { label: 'Carbs', grams: DEMO.carbs, kcal: DEMO.carbs * 4, color: MACRO_COLORS.carbs },
    { label: 'Fat', grams: DEMO.fat, kcal: DEMO.fat * 9, color: MACRO_COLORS.fat },
  ];

  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-[var(--shadow-lg)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">Today · Monday</p>
          <p className="mt-1 text-sm font-bold text-ink">Your plan</p>
        </div>
        <p className="text-right leading-none">
          <span className="text-2xl font-extrabold tracking-tight text-ink tabular-nums">
            {DEMO.calories.toLocaleString('en-IN')}
          </span>
          <span className="ml-1 text-xs font-bold text-muted">kcal</span>
        </p>
      </div>

      <ul className="mt-4 space-y-2.5">
        {TODAY.map((meal) => (
          <li key={meal.slug} className="flex items-center gap-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
              <Image src={`/images/meals/${meal.slug}.webp`} alt="" fill sizes="44px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.6875rem] font-semibold text-muted">
                {meal.slot} · {meal.time}
              </span>
              <span className="block truncate text-[0.875rem] font-bold text-ink">{meal.name}</span>
              <span className="block truncate text-[0.6875rem] text-muted">{meal.portion}</span>
            </span>
            <span className="shrink-0 text-[0.8125rem] font-bold text-ink tabular-nums">{meal.kcal}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-line pt-3.5">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          {bars.map((bar) => (
            <span key={bar.label} style={{ width: `${(bar.kcal / macroKcal) * 100}%`, backgroundColor: bar.color }} />
          ))}
        </div>
        <ul className="mt-2 flex justify-between text-[0.6875rem] font-semibold text-muted">
          {bars.map((bar) => (
            <li key={bar.label} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: bar.color }} aria-hidden="true" />
              {bar.label} <span className="font-bold text-ink tabular-nums">{bar.grams} g</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
      {/* A flat wash of brand tint — no glow blobs, so the photo stays the brightest thing. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[44rem] bg-linear-to-b from-brand-50 via-canvas to-canvas" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-[0.8125rem] font-semibold text-brand-800">
            <span className="size-1.5 rounded-full bg-saffron-500" aria-hidden="true" />
            Personalised for Indian kitchens
          </p>

          <h1
            id="hero-heading"
            className="mt-6 text-[2.625rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink [text-wrap:balance] sm:text-[3.75rem] lg:text-[4.25rem]"
          >
            Dal, roti, rice —<span className="block text-brand-700">portioned for your goal.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted lg:mx-0">
            Aahar Sathi turns your age, height, weight and activity into calorie and protein targets, then plans
            a week of home-style Indian meals in portions you can actually measure.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <ButtonLink href="/register" size="lg" className="w-full sm:w-auto">
              Create your free plan
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <DemoButton className="w-full sm:w-auto" />
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-ink-soft lg:justify-start">
            {['Ready in about a minute', 'Veg, egg or non-veg', 'No payment'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 text-brand-600" strokeWidth={3} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem]">
          <div className="relative mx-auto aspect-square w-[86%] lg:mr-0 lg:w-[80%]">
            <div aria-hidden="true" className="absolute -inset-[7%] rounded-full border border-brand-200/80" />
            <div aria-hidden="true" className="absolute -inset-[2%] rounded-full bg-brand-100/70" />
            <Image
              src="/images/hero-thali.webp"
              alt="A home-cooked thali with rotis, rice, dal, green beans, curd and pickle"
              fill
              preload
              sizes="(max-width: 1024px) 80vw, 29rem"
              className="rounded-full object-cover shadow-[var(--shadow-lg)]"
            />
          </div>

          <div className="relative z-10 mx-auto -mt-16 w-[min(20rem,100%)] text-left lg:absolute lg:-bottom-10 lg:-left-10 lg:mt-0 lg:w-[19rem]">
            <PlanCard />
          </div>

          <div className="absolute right-0 top-[8%] z-10 hidden rounded-2xl border border-line bg-white px-4 py-3 text-left shadow-[var(--shadow-md)] sm:block">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">Water today</p>
            <p className="mt-0.5 text-lg font-extrabold text-ink tabular-nums">
              {DEMO.water} <span className="text-xs font-bold text-muted">glasses</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
