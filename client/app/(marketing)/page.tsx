import Link from 'next/link';
import {
  ArrowRight,
  CalendarRange,
  Check,
  Droplets,
  RefreshCw,
  ShoppingBasket,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { DemoButton } from '@/components/DemoButton';
import { Logo } from '@/components/ui/Logo';
import { Thali } from '@/components/illustrations/Thali';
import { HeroGlow, Underline, WaveDivider } from '@/components/illustrations/Decor';
import { MathsScene, PlanScene, ProfileScene } from '@/components/illustrations/Scenes';
import { MealPhoto } from '@/components/plan/MealPhoto';
import { DISCLAIMER } from '@/lib/constants';

const FACTS = [
  { value: '82', label: 'home-style dishes' },
  { value: '5', label: 'meals a day' },
  { value: '7', label: 'days, planned' },
  { value: '4', label: 'regions of India' },
];

const STEPS = [
  {
    title: 'Tell us about you',
    body: 'Age, height, weight, how active your week is, and what you eat. About a minute, with a sensible range on every field.',
    Art: ProfileScene,
  },
  {
    title: 'We do the maths',
    body: 'Mifflin–St Jeor BMR × your activity, adjusted for your goal. You get calories, protein, carbs, fat and a water target — and the working, shown.',
    Art: MathsScene,
  },
  {
    title: 'Cook and track',
    body: 'A week of real Indian meals portioned to your targets, with a grocery list, a water tracker and charts that show the trend.',
    Art: PlanScene,
  },
];

const FEATURES = [
  {
    icon: CalendarRange,
    title: 'Five meals, every day',
    body: 'Breakfast, two snacks, lunch and dinner — each scaled to its share of your calories, in portions you can actually measure.',
    tint: 'bg-brand-50 text-brand-700',
  },
  {
    icon: RefreshCw,
    title: 'Swap anything',
    body: 'Not in the mood for ghugni? Swap that one meal for another that fits the same calories, or reshuffle the whole week.',
    tint: 'bg-saffron-50 text-saffron-700',
  },
  {
    icon: ShoppingBasket,
    title: 'A grocery list that ticks off',
    body: 'Every ingredient the week needs, de-duplicated and grouped by aisle. Your ticks are saved as you shop.',
    tint: 'bg-sky-50 text-water-700',
  },
  {
    icon: Droplets,
    title: 'Water, one glass at a time',
    body: '35 ml per kilo, plus extra if you train hard. Tap a glass to fill up to it — the day is saved as you go.',
    tint: 'bg-sky-50 text-water-700',
  },
  {
    icon: TrendingUp,
    title: 'Progress you can read',
    body: 'Weight over 7, 30 or 90 days, and how your water intake compares with the target for the last fortnight.',
    tint: 'bg-brand-50 text-brand-700',
  },
  {
    icon: Sparkles,
    title: 'Numbers you can check',
    body: 'Every target opens up to show the formula behind it — BMR, activity multiplier, goal adjustment and the macro split.',
    tint: 'bg-saffron-50 text-saffron-700',
  },
];

const SAMPLE_DAY = [
  { slot: 'breakfast', slug: 'poha-peanuts', time: '7:00 AM', name: 'Poha with peanuts and sprouts', kcal: 531, protein: 23 },
  { slot: 'midMorning', slug: 'sprouts-chaat', time: '10:30 AM', name: 'Sprouts chaat with lemon', kcal: 224, protein: 15 },
  { slot: 'lunch', slug: 'rajma-chawal', time: '1:00 PM', name: 'Rajma with rice and salad', kcal: 650, protein: 20 },
  { slot: 'eveningSnack', slug: 'chaas-peanuts', time: '4:30 PM', name: 'Masala chaas with peanuts', kcal: 215, protein: 10 },
  { slot: 'dinner', slug: 'palak-paneer-roti', time: '7:30 PM', name: 'Palak paneer with rotis', kcal: 529, protein: 22 },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <main id="main-content">
      {/* ---------------- Hero ---------------- */}
      <div className="relative overflow-hidden bg-brand-900 text-white">
        <HeroGlow idPrefix="hero-glow" />
        <div className="dot-grid absolute inset-0 opacity-60" aria-hidden="true" />

        <div className="relative">
          <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <Logo href="/" tone="light" />
            <nav className="flex items-center gap-1.5" aria-label="Marketing navigation">
              <a
                href="#how-it-works"
                className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white md:inline-flex"
              >
                How it works
              </a>
              <a
                href="#sample-plan"
                className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex"
              >
                Sample plan
              </a>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-brand-800 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Get started
              </Link>
            </nav>
          </header>

          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:pb-20 lg:pt-14">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[0.8125rem] font-semibold ring-1 ring-inset ring-white/20">
                <span className="size-1.5 rounded-full bg-saffron-400" aria-hidden="true" />
                Built for Indian kitchens
              </span>

              <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[3.25rem] lg:text-[3.5rem]">
                A 7-day Indian meal plan,{' '}
                <span className="relative inline-block">
                  built for you
                  <Underline className="absolute -bottom-1.5 left-0 text-saffron-400" />
                </span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-white/85">
                Tell us your body, your goal and how you eat. Get calorie and macro targets worked out
                properly, a full week of home-style meals in real portions, and a grocery list to match.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/register" size="lg" variant="inverse" className="w-full sm:w-auto">
                  Create your free plan
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
                <DemoButton className="w-full sm:w-auto" />
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
                {['No payment', 'No app to install', 'Veg, egg and non-veg'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-brand-300" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Thali with floating figures pulled from a real plan */}
            <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-[28rem]">
              <div className="motion-safe:animate-[float_7s_ease-in-out_infinite]">
                <Thali priority className="drop-shadow-[0_28px_48px_rgba(0,0,0,0.35)]" />
              </div>

              <div className="absolute -left-2 top-6 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:left-0">
                <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">Daily target</p>
                <p className="text-lg font-extrabold text-ink">
                  2,125 <span className="text-xs font-bold text-muted">kcal</span>
                </p>
              </div>

              <div className="absolute -right-1 top-1/3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:right-2">
                <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">Protein</p>
                <p className="text-lg font-extrabold text-ink">
                  104 <span className="text-xs font-bold text-muted">g</span>
                </p>
              </div>

              <div className="absolute bottom-6 left-4 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:left-8">
                <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">Water</p>
                <p className="text-lg font-extrabold text-ink">
                  11 <span className="text-xs font-bold text-muted">glasses</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <WaveDivider className="text-canvas" />
      </div>

      {/* ---------------- Facts ---------------- */}
      <section className="mx-auto -mt-6 max-w-6xl px-4 sm:px-6 lg:px-8">
        <dl className="surface-raised grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse items-center gap-1 px-5 py-5 text-center">
              <dt className="text-[0.8125rem] font-semibold text-muted">{fact.label}</dt>
              <dd className="text-3xl font-extrabold tracking-tight text-brand-800">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Three steps, then you are cooking
          </h2>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted">
            Nothing generic and nothing imported. The numbers are worked out for your body, and the food is
            what you would cook at home anyway.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="surface group relative overflow-hidden p-6 transition-[box-shadow,transform] duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[var(--shadow-md)]"
            >
              <div className="rounded-2xl bg-canvas p-4 ring-1 ring-line">
                <step.Art />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-800 text-sm font-extrabold text-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold text-ink">{step.title}</h3>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- Sample day ---------------- */}
      <section id="sample-plan" className="scroll-mt-6 border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="eyebrow">A day on the plan</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Real food, in portions you can measure
            </h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">
              Bowls, katoris, rotis and glasses — not grams of &ldquo;chicken breast&rdquo;. Each dish is scaled to its
              slot, so breakfast is a quarter of your day and lunch is nearly a third.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                'Vegetarian, eggetarian and non-vegetarian plans',
                'North, South, Eastern and Western Indian dishes',
                'No dish twice in a row, and never more than twice a week',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[0.9375rem] text-ink-soft">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-100">
                    <Check className="size-3 text-brand-800" strokeWidth={3.5} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-raised overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-line bg-canvas px-5 py-3.5">
              <p className="text-sm font-bold text-ink">Monday</p>
              <p className="text-[0.8125rem] font-semibold text-muted tabular-nums">2,149 kcal · 90 g protein</p>
            </div>
            <ol className="divide-y divide-line">
              {SAMPLE_DAY.map((meal) => (
                <li key={meal.slot} className="flex items-center gap-3.5 px-5 py-3.5">
                  <MealPhoto slug={meal.slug} slot={meal.slot} className="size-12" sizes="48px" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted">{meal.time}</p>
                    <p className="truncate text-[0.9375rem] font-semibold text-ink">{meal.name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-ink tabular-nums">{meal.kcal}</p>
                    <p className="text-[0.6875rem] font-semibold text-muted tabular-nums">{meal.protein} g P</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">What you get</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Everything the plan comes with
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="surface p-6 transition-[box-shadow,transform] duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[var(--shadow-md)]"
            >
              <span className={`grid size-11 place-items-center rounded-xl ${feature.tint}`}>
                <feature.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[1.0625rem] font-bold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-16 text-center text-white sm:px-12">
          <HeroGlow idPrefix="cta-glow" className="opacity-80" />
          <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to eat better this week?</h2>
            <p className="mx-auto mt-3 max-w-xl text-[1.0625rem] text-white/85">
              Your plan takes about a minute to set up, and you can swap any dish you do not fancy.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg" variant="inverse" className="w-full sm:w-auto">
                Get started — it is free
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <DemoButton className="w-full sm:w-auto" />
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <Logo href="/" />
            <nav className="flex gap-6 text-sm font-semibold text-muted">
              <Link href="/login" className="transition-colors hover:text-ink">
                Sign in
              </Link>
              <Link href="/register" className="transition-colors hover:text-ink">
                Create account
              </Link>
            </nav>
          </div>
          <p className="mt-8 max-w-3xl border-t border-line pt-6 text-xs leading-relaxed text-muted">
            {DISCLAIMER}
          </p>
          <p className="mt-4 text-xs text-muted">© {new Date().getFullYear()} Aahar Sathi · aaharsathi.in</p>
        </div>
      </footer>
    </div>
  );
}
