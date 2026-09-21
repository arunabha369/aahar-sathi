import type { ReactNode } from 'react';
import Image from 'next/image';
import { ArrowDown, Check, Repeat2 } from 'lucide-react';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { DEMO } from '@/components/marketing/content';
import { MACRO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

function Tile({
  title,
  body,
  children,
  className,
}: {
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li className={cn('reveal flex flex-col overflow-hidden rounded-3xl border border-line bg-surface', className)}>
      <div className="p-6 pb-0 sm:p-7 sm:pb-0">
        <h3 className="text-lg font-bold tracking-tight text-ink">{title}</h3>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{body}</p>
      </div>
      {/* The visual is an illustration of the product — the text above carries the meaning. */}
      <div aria-hidden="true" className="mt-6 flex flex-1 flex-col justify-center px-6 pb-6 sm:px-7 sm:pb-7">
        {children}
      </div>
    </li>
  );
}

function Thumb({ slug, className = 'size-12' }: { slug: string; className?: string }) {
  return (
    <span className={cn('relative shrink-0 overflow-hidden rounded-xl ring-1 ring-line', className)}>
      <Image src={`/images/meals/${slug}.webp`} alt="" fill sizes="56px" className="object-cover" />
    </span>
  );
}

function PortionsVisual() {
  const rows = [
    { slug: 'idli-sambar', name: 'Idli with sambar', portion: '3 idlis · 1 bowl sambar', kcal: 354 },
    { slug: 'rajma-chawal', name: 'Rajma chawal', portion: '1¼ bowls rajma · 2 bowls rice', kcal: 650 },
    { slug: 'paneer-bhurji-roti', name: 'Paneer bhurji', portion: '1 bowl bhurji · 3 rotis', kcal: 632 },
  ];
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line">
      {rows.map((row) => (
        <li key={row.slug} className="flex items-center gap-3.5 px-4 py-3">
          <Thumb slug={row.slug} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-bold text-ink">{row.name}</span>
            <span className="block truncate text-[0.8125rem] font-semibold text-brand-700">{row.portion}</span>
          </span>
          <span className="shrink-0 text-sm font-bold text-ink tabular-nums">{row.kcal}</span>
        </li>
      ))}
    </ul>
  );
}

function SwapVisual() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-2xl border border-line px-3.5 py-3 opacity-60">
        <Thumb slug="chole-jeera-rice" className="size-10" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-muted line-through">Chole with jeera rice</span>
      </div>
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-canvas">
          <Repeat2 className="size-3.5" /> Swap
          <ArrowDown className="size-3.5" />
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border-2 border-brand-600 bg-brand-50 px-3.5 py-3">
        <Thumb slug="palak-paneer-roti" className="size-10" />
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">Palak paneer with rotis</span>
      </div>
    </div>
  );
}

function GroceryVisual() {
  const items = [
    { name: 'Rajma (kidney beans)', done: true, category: 'Lentils & Legumes' as const },
    { name: 'Paneer', done: true, category: 'Dairy & Paneer' as const },
    { name: 'Spinach (palak)', done: false, category: 'Vegetables & Fruits' as const },
    { name: 'Whole wheat flour (atta)', done: false, category: 'Grains & Flours' as const },
  ];
  return (
    <div className="rounded-2xl border border-line p-3">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.name} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
            <span
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-[0.3rem] border-2',
                item.done ? 'border-accent bg-accent' : 'border-line-strong',
              )}
            >
              {item.done ? <Check className="size-3 text-accent-ink" strokeWidth={3.5} /> : null}
            </span>
            <span className={cn('min-w-0 flex-1 truncate text-sm', item.done ? 'text-muted line-through' : 'font-medium text-ink')}>
              {item.name}
            </span>
            <CategoryIcon category={item.category} className="size-4 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function WaterVisual() {
  const filled = 8;
  return (
    <div>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: DEMO.water }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'relative h-10 overflow-hidden rounded-b-lg rounded-t-sm border-2',
              index < filled ? 'border-water-500' : 'border-line-strong',
            )}
          >
            {index < filled ? <span className="absolute inset-x-0 bottom-0 h-[72%] bg-water-400" /> : null}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">
        <span className="tabular-nums">{filled}</span> of {DEMO.water} glasses
        <span className="text-muted"> · 2 L of 2.75 L</span>
      </p>
    </div>
  );
}

function MacroVisual() {
  const macros = [
    { label: 'Protein', grams: DEMO.protein, kcal: DEMO.protein * 4, color: MACRO_COLORS.protein },
    { label: 'Carbs', grams: DEMO.carbs, kcal: DEMO.carbs * 4, color: MACRO_COLORS.carbs },
    { label: 'Fat', grams: DEMO.fat, kcal: DEMO.fat * 9, color: MACRO_COLORS.fat },
  ];
  const total = macros.reduce((sum, macro) => sum + macro.kcal, 0);
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {macros.map((macro) => (
          <span key={macro.label} style={{ width: `${(macro.kcal / total) * 100}%`, backgroundColor: macro.color }} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        {macros.map((macro) => (
          <div key={macro.label} className="rounded-xl bg-surface-2 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: macro.color }} />
              {macro.label}
            </dt>
            <dd className="mt-1 text-lg font-extrabold text-ink tabular-nums">{macro.grams} g</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** 30 days of the demo account's logged weight, reduced to a smooth trend line. */
const TREND = [76.5, 76.4, 76.3, 76.1, 76.2, 75.9, 75.8, 75.8, 75.9, 75.6, 75.5, 75.5, 75.3, 75.2, 75.3,
  75.0, 75.0, 74.8, 74.8, 74.6, 74.7, 74.5, 74.4, 74.4, 74.3, 74.1, 74.2, 74.0, 73.9, 73.9];

function ProgressVisual() {
  const width = 520;
  const height = 120;
  const min = 73.5;
  const max = 76.8;
  const points = TREND.map((kg, index) => {
    const x = (index / (TREND.length - 1)) * width;
    const y = height - ((kg - min) / (max - min)) * height;
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1]!;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-ink tabular-nums">−2.6 kg</span>
        <span className="text-sm font-semibold text-muted">over 30 days</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height + 8}`} className="mt-4 h-28 w-full" preserveAspectRatio="none">
        <path d={area} fill="#a78bfa" fillOpacity="0.15" />
        <path d={line} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={last[0]} cy={last[1]} r="5" fill="#a78bfa" stroke="#151716" strokeWidth="2" />
      </svg>
    </div>
  );
}

function DietVisual() {
  const diets = [
    { slug: 'veg', label: 'Vegetarian' },
    { slug: 'egg', label: 'Eggetarian' },
    { slug: 'nonveg', label: 'Non-veg' },
  ];
  return (
    <ul className="grid grid-cols-3 gap-3">
      {diets.map((diet) => (
        <li key={diet.slug} className="text-center">
          <span className="relative mx-auto block aspect-square w-full max-w-24 overflow-hidden rounded-full ring-1 ring-line">
            <Image src={`/images/diet/${diet.slug}.webp`} alt="" fill sizes="96px" className="object-cover" />
          </span>
          <span className="mt-2 block text-xs font-bold text-ink">{diet.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function FeatureBento() {
  return (
    <section id="features" aria-labelledby="features-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionIntro id="features-heading" eyebrow="Features" title="Everything a week of eating well needs.">
        One plan, and the tools around it — so the food, the shopping and the tracking all line up.
      </SectionIntro>

      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Tile
          className="md:col-span-2"
          title="Measured in katoris, not grams"
          body="Each dish is scaled to its share of your day, in bowls, rotis and idlis — the way you already serve food."
        >
          <PortionsVisual />
        </Tile>
        <Tile title="Swap anything" body="Not in the mood for chole? Swap for a dish that fits the same calories.">
          <SwapVisual />
        </Tile>
        <Tile title="A grocery list that ticks off" body="Every ingredient for the week, grouped by aisle. Ticks save as you shop.">
          <GroceryVisual />
        </Tile>
        <Tile title="Water, a glass at a time" body="Your target comes from your weight and activity. Tap a glass to log it.">
          <WaterVisual />
        </Tile>
        <Tile title="Macros set for your goal" body="Protein first, fat at a quarter of your calories, carbs for the rest.">
          <MacroVisual />
        </Tile>
        <Tile
          className="md:col-span-2"
          title="Progress you can read"
          body="Log your weight each morning and see the trend over 7, 30 or 90 days — the direction matters more than any one day."
        >
          <ProgressVisual />
        </Tile>
        <Tile title="Veg, egg or non-veg" body="Strictly respected. A vegetarian plan never slips in an egg.">
          <DietVisual />
        </Tile>
      </ul>
    </section>
  );
}
