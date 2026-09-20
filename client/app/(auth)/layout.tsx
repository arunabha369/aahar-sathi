import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Thali } from '@/components/illustrations/Thali';
import { HeroGlow } from '@/components/illustrations/Decor';

const POINTS = [
  'Calorie and macro targets worked out for your body',
  '7 days of home-style Indian meals in real portions',
  'A grocery list, a water tracker and progress charts',
];

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel — desktop only, so the form owns small screens */}
      <aside className="relative hidden overflow-hidden bg-brand-900 p-10 text-white lg:flex lg:flex-col">
        <HeroGlow idPrefix="auth-glow" />
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="relative flex h-full flex-col">
          <Logo href="/" tone="light" />

          <div className="my-auto py-10">
            <div className="mx-auto w-full max-w-[22rem]">
              <Thali idPrefix="auth-thali" className="drop-shadow-[0_24px_40px_rgba(0,0,0,0.35)]" />
            </div>

            <h2 className="mt-10 max-w-md text-[1.75rem] font-extrabold leading-tight tracking-tight">
              Food you already cook, portioned for the body you have.
            </h2>

            <ul className="mt-6 space-y-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-white/85">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/15">
                    <Check className="size-3 text-brand-300" strokeWidth={3.5} aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Aahar Sathi</p>
        </div>
      </aside>

      {/* Form side */}
      <main className="flex flex-col bg-canvas">
        <div className="flex items-center justify-between px-4 py-5 sm:px-8 lg:justify-end">
          <span className="lg:hidden">
            <Logo href="/" showTagline={false} />
          </span>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-8">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>
      </main>
    </div>
  );
}
