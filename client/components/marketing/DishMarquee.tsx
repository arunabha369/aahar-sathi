'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import type { Dish } from '@/components/marketing/content';
import { cn } from '@/lib/utils';

function DishList({ dishes, hidden = false }: { dishes: Dish[]; hidden?: boolean }) {
  return (
    <ul
      // The second copy exists only to make the loop seamless — keep it out of the
      // accessibility tree and the tab order.
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={cn('flex shrink-0 gap-4 pr-4', hidden && 'motion-reduce:hidden')}
    >
      {dishes.map((dish) => (
        <li key={dish.slug} className="w-52 shrink-0 sm:w-60">
          <figure>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas ring-1 ring-line">
              <Image src={`/images/meals/${dish.slug}.webp`} alt="" fill sizes="240px" className="object-cover" />
            </div>
            <figcaption className="mt-2.5 px-0.5">
              <span className="block truncate text-[0.9375rem] font-bold text-ink">{dish.name}</span>
              <span className="block text-[0.8125rem] text-muted">
                {dish.region} · <span className="tabular-nums">{dish.kcal}</span> kcal
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

export function DishMarquee({ dishes }: { dishes: Dish[] }) {
  const [paused, setPaused] = useState(false);

  return (
    <section aria-labelledby="dishes-heading" className="border-y border-line bg-surface py-12 sm:py-14">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-brand-700">On the menu</p>
          <h2 id="dishes-heading" className="mt-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            82 home-style dishes, from every corner of India
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-ink-soft ring-1 ring-line transition-colors hover:bg-surface-2 hover:text-ink motion-reduce:hidden"
        >
          {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
          {paused ? 'Play' : 'Pause'}
          <span className="sr-only"> the scrolling dishes</span>
        </button>
      </div>

      <div
        className={cn(
          'group mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]',
          // Reduced motion: no movement at all — the strip becomes a plain scrollable row.
          'motion-reduce:overflow-x-auto motion-reduce:[mask-image:none] motion-reduce:px-4 sm:motion-reduce:px-6',
        )}
      >
        <div
          className={cn(
            'flex w-max animate-marquee motion-reduce:animate-none',
            'group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]',
            paused && '[animation-play-state:paused]',
          )}
        >
          <DishList dishes={dishes} />
          <DishList dishes={dishes} hidden />
        </div>
      </div>
    </section>
  );
}
