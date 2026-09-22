'use client';

import { useOptimistic, useState, useTransition, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb } from 'lucide-react';
import { MealList } from '@/components/plan/MealList';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { WEEKDAY_LABELS } from '@/lib/constants';
import { weekdayFromKey } from '@/lib/format';
import { useLocalToday } from '@/lib/useLocalToday';
import type { Diet, PlanDay, PlanResponse, PlanSlot, Targets } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DayTabsProps {
  planId: string;
  days: PlanDay[];
  targets: Targets;
  diet: Diet;
  serverToday: string;
  readOnly?: boolean;
  /** Where Ramadan times were calculated for. */
  cityName?: string | null;
  /** Which day opens first. The dashboard starts at tomorrow, since today is already above it. */
  startDay?: 'today' | 'tomorrow';
}

export function DayTabs({
  planId,
  days,
  targets,
  diet,
  serverToday,
  readOnly = false,
  cityName = null,
  startDay = 'today',
}: DayTabsProps) {
  const router = useRouter();
  const toast = useToast();
  const today = weekdayFromKey(useLocalToday(serverToday));
  const [activeDay, setActiveDay] = useState(() => {
    const index = days.findIndex((day) => day.day === today);
    if (index < 0) return 0;
    return startDay === 'tomorrow' ? (index + 1) % days.length : index;
  });
  const [, startTransition] = useTransition();
  const [swappingSlots, addSwappingSlot] = useOptimistic<PlanSlot[], PlanSlot>(
    [],
    (current, slot) => [...current, slot],
  );

  const swap = (slot: PlanSlot) => {
    startTransition(async () => {
      addSwappingSlot(slot);
      try {
        await api.post<PlanResponse>(`/plans/${planId}/swap`, { dayIndex: activeDay, slot });
        router.refresh();
        toast.success('Swapped for another dish');
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not swap that meal.');
      }
    });
  };

  const day = days[activeDay];
  if (!day) return null;

  /** The tab strip behaves the way tabs are expected to: arrows move, Home and End jump. */
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    const step = moves[event.key];
    const next =
      step !== undefined
        ? (activeDay + step + days.length) % days.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? days.length - 1
            : null;
    if (next === null) return;
    event.preventDefault();
    setActiveDay(next);
    document.getElementById(`day-tab-${days[next]!.day}`)?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Days of the week"
        data-print="hide"
        className="no-print -my-1 flex gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((candidate, index) => {
          const selected = index === activeDay;
          const isToday = candidate.day === today;
          return (
            <button
              key={candidate.day}
              role="tab"
              type="button"
              id={`day-tab-${candidate.day}`}
              aria-selected={selected}
              aria-controls={`day-panel-${candidate.day}`}
              onClick={() => setActiveDay(index)}
              onKeyDown={onTabKey}
              // Only the selected tab is in the tab order; arrows move between them.
              tabIndex={selected ? 0 : -1}
              // Keep a keyboard-focused tab fully inside the horizontally scrolling strip.
              onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })}
              className={cn(
                'group relative min-h-[3.25rem] shrink-0 rounded-xl px-4 text-center transition-all',
                selected
                  ? 'bg-accent text-accent-ink'
                  : 'bg-surface-2 text-ink-soft ring-1 ring-line hover:bg-surface-3 hover:text-ink',
              )}
            >
              <span className="block text-[0.8125rem] font-bold">{candidate.day}</span>
              <span
                className={cn(
                  'block text-[0.625rem] font-semibold tabular-nums',
                  selected ? 'text-accent-ink/75' : 'text-muted',
                )}
              >
                {isToday ? 'Today' : candidate.kind === 'vrat' ? 'Vrat' : `${candidate.totals.kcal} kcal`}
              </span>
            </button>
          );
        })}
      </div>

      {/* On paper the whole week is printed below, so the single-day panel is hidden. */}
      <div
        role="tabpanel"
        id={`day-panel-${day.day}`}
        aria-labelledby={`day-tab-${day.day}`}
        className="mt-5 print:hidden"
      >
        <h3 className="eyebrow mb-3">{WEEKDAY_LABELS[day.day] ?? day.day}</h3>
        <MealList
          day={day}
          targets={targets}
          diet={diet}
          swappingSlots={swappingSlots}
          cityName={cityName}
          {...(readOnly ? {} : { onSwap: swap })}
        />
      </div>

      <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 text-[0.8125rem] leading-relaxed text-brand-800 ring-1 ring-inset ring-brand-100 print:hidden">
        <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Keep a 2.5–3 hour gap between meals for better digestion.
      </p>

      <div className="hidden print:block">
        {days.map((printDay) => (
          <section key={printDay.day} className="mt-6">
            <h3 className="mb-3 text-base font-bold text-ink">{WEEKDAY_LABELS[printDay.day] ?? printDay.day}</h3>
            <MealList day={printDay} targets={targets} diet={diet} cityName={cityName} />
          </section>
        ))}
      </div>
    </div>
  );
}
