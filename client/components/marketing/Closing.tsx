import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { DemoButton } from '@/components/DemoButton';
import { Logo } from '@/components/ui/Logo';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { DEMO, FAQ, METHOD, REGIONS } from '@/components/marketing/content';
import { DISCLAIMER } from '@/lib/constants';

export function Regions() {
  return (
    <section aria-labelledby="regions-heading" className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro id="regions-heading" eyebrow="Your kind of food" title="From idli to ghugni — the food you grew up with.">
          Pick a favourite cuisine and about seven in ten dishes come from it. The rest keep the week interesting.
        </SectionIntro>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REGIONS.map((region) => (
            <li key={region.name} className="reveal overflow-hidden rounded-3xl border border-line bg-canvas">
              <div className="relative aspect-[4/3]">
                <Image src={`/images/meals/${region.photo}.webp`} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 18rem" className="object-cover" />
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-ink">{region.name}</h3>
                  <span className="text-[0.8125rem] font-semibold text-muted tabular-nums">{region.count} dishes</span>
                </div>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{region.dishes.join(' · ')}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="reveal mt-6 text-sm text-muted">
          Plus 18 dishes eaten all over India, like vegetable pulao, soya curry and masala omelette.
        </p>
      </div>
    </section>
  );
}

export function Method() {
  return (
    <section id="method" aria-labelledby="method-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <SectionIntro id="method-heading" eyebrow="The method" title="Numbers you can check, not a black box.">
            Every target comes from published, widely used formulas — and the app shows its working, so you never
            have to take a number on trust.
          </SectionIntro>
          <div className="reveal mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <p className="text-sm font-semibold text-brand-800">A worked example</p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
              A 29-year-old man, 74 kg and 175 cm, who goes to the gym 3–5 days a week and wants to lose weight:
              <span className="mt-2 block font-bold text-ink tabular-nums">
                {DEMO.bmr.toLocaleString('en-IN')} × {DEMO.multiplier} = {DEMO.tdee.toLocaleString('en-IN')} − {DEMO.deficit} ={' '}
                {DEMO.calories.toLocaleString('en-IN')} kcal a day
              </span>
            </p>
          </div>
        </div>

        <dl className="reveal divide-y divide-line self-start overflow-hidden rounded-3xl border border-line bg-white">
          {METHOD.map((row) => (
            <div key={row.label} className="grid gap-1 px-6 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-muted">{row.label}</dt>
              <dd className="text-[0.9375rem] font-semibold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-16 lg:px-8 lg:py-28">
        <SectionIntro id="faq-heading" eyebrow="FAQ" title="Questions, answered." className="lg:sticky lg:top-28 lg:self-start">
          Something else on your mind? Try the demo — it is the fastest way to see how the plan works.
        </SectionIntro>

        <div className="reveal divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-[1.0625rem] font-bold text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="-mt-1 pb-6 pr-10 text-[0.9375rem] leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const photos = ['masala-dosa-sambar', 'palak-paneer-roti', 'khaman-dhokla'];
  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="reveal grid items-center gap-10 overflow-hidden rounded-[2rem] bg-brand-900 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:p-14">
        <div>
          <h2 id="cta-heading" className="text-[2rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.625rem]">
            Your first week is a minute away.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-brand-100">
            Answer a few questions and get targets, seven days of meals and a grocery list — free.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg" variant="inverse" className="w-full sm:w-auto">
              Create your free plan
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <DemoButton className="w-full sm:w-auto" />
          </div>
        </div>

        <div aria-hidden="true" className="grid grid-cols-3 gap-3 lg:grid-cols-2">
          {photos.map((slug, index) => (
            <div
              key={slug}
              className={
                index === 0
                  ? 'relative aspect-square overflow-hidden rounded-2xl lg:col-span-2 lg:aspect-[2/1]'
                  : 'relative aspect-square overflow-hidden rounded-2xl'
              }
            >
              <Image src={`/images/meals/${slug}.webp`} alt="" fill sizes="(max-width: 1024px) 33vw, 22rem" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const columns = [
    {
      title: 'Product',
      links: [
        { href: '#how-it-works', label: 'How it works' },
        { href: '#features', label: 'Features' },
        { href: '#method', label: 'The method' },
        { href: '#faq', label: 'FAQ' },
      ],
    },
    {
      title: 'Account',
      links: [
        { href: '/register', label: 'Create account' },
        { href: '/login', label: 'Sign in' },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo href="/" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Personalised 7-day Indian meal plans, worked out from your body and your goal.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sm font-bold text-ink">{column.title}</p>
              <ul className="mt-3 space-y-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith('#') ? (
                      <a href={link.href} className="-mx-2 inline-flex min-h-11 min-w-11 items-center px-2 text-sm text-muted transition-colors hover:text-ink">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="-mx-2 inline-flex min-h-11 min-w-11 items-center px-2 text-sm text-muted transition-colors hover:text-ink">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
          <p className="mt-4 text-xs text-muted">© {new Date().getFullYear()} Aahar Sathi · aaharsathi.in</p>
        </div>
      </div>
    </footer>
  );
}
