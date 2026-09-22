'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Panel } from '@/components/ui/Card';
import { addDays, formatDayLong, todayKey } from '@/lib/format';
import { useDiary } from '@/lib/useDiary';
import { useLocalToday } from '@/lib/useLocalToday';
import type { DiaryDay } from '@/lib/types';
import { FastDayNote } from '@/components/plan/FastDayNote';
import { DiaryMeals } from './DiaryMeals';
import { EatenSummary } from './EatenSummary';

const shift = (date: string, days: number) => todayKey(addDays(new Date(`${date}T00:00:00`), days));

const navLink =
  'inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-ink-soft ring-1 ring-line transition-colors hover:bg-surface-2 hover:text-ink';

/** One day of the food diary, with links to the days either side (never into the future). */
export function DiaryView({ initial, requestedDate, serverToday }: { initial: DiaryDay; requestedDate: string | null; serverToday: string }) {
  const today = useLocalToday(serverToday);
  // With no ?date the page shows the browser's today, even if the server's clock differs.
  const date = requestedDate ?? today;
  const diary = useDiary(initial, date);
  const { day } = diary;
  const isToday = date === today;

  return (
    <div className="space-y-5">
      <nav aria-label="Choose a day" className="flex items-center justify-between gap-3">
        <Link href={`/diary?date=${shift(date, -1)}`} className={navLink}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Earlier
        </Link>
        <p className="text-center text-sm font-bold text-ink" aria-live="polite">
          {isToday ? 'Today' : formatDayLong(date)}
        </p>
        {isToday ? (
          <span className={`${navLink} pointer-events-none opacity-40`} aria-hidden="true">
            Later
            <ChevronRight className="size-4" />
          </span>
        ) : (
          <Link href={shift(date, 1) >= today ? '/diary' : `/diary?date=${shift(date, 1)}`} className={navLink}>
            Later
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </nav>

      {day.targets ? (
        <Panel>
          <h2 className="sr-only">Eaten on {formatDayLong(date)}</h2>
          <EatenSummary eaten={day.eaten} targets={day.targets} {...(day.planned.length ? { planned: day.planned.reduce((sum, meal) => sum + meal.kcal, 0) } : {})} />
        </Panel>
      ) : null}

      <Panel>
        <h2 className="mb-4 text-base font-bold text-ink sm:text-lg">{isToday ? 'What did you eat today?' : `What you ate on ${formatDayLong(date)}`}</h2>
        {!isToday && day.planned.length > 0 ? (
          <p className="-mt-2 mb-4 text-sm text-muted">These are the meals your current plan has for a {day.weekday}.</p>
        ) : null}
        <FastDayNote kind={day.kind} fastTimes={day.fastTimes} />
        <DiaryMeals diary={diary} canLog />
      </Panel>
    </div>
  );
}
