import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import Image from 'next/image';

const POINTS = [
  'Calorie and macro targets worked out for your body',
  '7 days of home-style Indian meals in real portions',
  'A grocery list, a water tracker and progress charts',
];

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel — desktop only, so the form owns small screens */}
      <aside className="relative hidden overflow-hidden bg-canvas p-10 text-white lg:flex lg:flex-col">
        <Image
          src="/images/auth-panel.webp"
          alt=""
          fill
          preload
          sizes="55vw"
          className="object-cover"
        />
        {/* Near-black behind the copy keeps white text readable on any photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-canvas from-35% via-canvas/80 to-canvas/25"
        />
        {/* …and a fade at the top, where the logo's small tagline meets the window light. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-44 bg-linear-to-b from-canvas/85 to-transparent" />

        <div className="relative flex h-full flex-col">
          <Logo href="/" tone="light" />

          <div className="mt-auto pb-10 pt-40">
            <h2 className="max-w-md text-[1.75rem] font-extrabold leading-tight tracking-tight">
              Food you already cook, portioned for the body you have.
            </h2>

            <ul className="mt-6 space-y-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-white/85">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent">
                    <Check className="size-3 text-accent-ink" strokeWidth={3.5} aria-hidden="true" />
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
      <main id="main-content" className="flex flex-col bg-canvas lg:border-l lg:border-line">
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
