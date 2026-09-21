import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { DemoButton } from '@/components/DemoButton';

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
          <Image
            src="/images/hero-character.png"
            alt="A character presenting a personalised Indian meal plan with calorie tracking, dal, roti, rice and a green smoothie"
            width={1024}
            height={680}
            preload
            sizes="(max-width: 1024px) 90vw, 34rem"
            className="h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
          />
        </div>
      </div>
    </section>
  );
}
