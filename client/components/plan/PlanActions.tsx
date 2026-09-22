'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ClipboardCopy, MessageCircle, Printer, Share2, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { mealLabel } from '@/lib/meals';
import { formatItem, litres, weekdayFromKey } from '@/lib/format';
import { useLocalToday } from '@/lib/useLocalToday';
import type { Plan, PlanResponse } from '@/lib/types';

function planAsText(plan: Plan): string {
  const lines = [
    'Aahar Sathi — my 7-day plan',
    '',
    `Daily target: ${plan.targets.calories} kcal`,
    `Protein ${plan.targets.protein} g · Carbs ${plan.targets.carbs} g · Fat ${plan.targets.fat} g`,
    `Water: ${plan.targets.waterGlasses} glasses (${litres(plan.targets.waterGlasses)})`,
    `BMI: ${plan.targets.bmi.toFixed(1)} (${plan.targets.bmiCategory})`,
    '',
  ];

  for (const day of plan.days) {
    lines.push(`${day.day} — ${day.totals.kcal} kcal`);
    for (const meal of day.meals) {
      lines.push(
        `  ${meal.time} ${mealLabel(meal)}: ${meal.name} (${meal.items
          .map((item) => formatItem(item))
          .join(', ')}) — ${meal.kcal} kcal, ${meal.protein} g protein`,
      );
    }
    lines.push('');
  }

  lines.push('Made with Aahar Sathi — aaharsathi.in');
  return lines.join('\n');
}

function todaySummary(plan: Plan, today: string): string {
  const day = plan.days.find((candidate) => candidate.day === today) ?? plan.days[0];
  const meals = day
    ? day.meals.map((meal) => `${meal.time} — ${meal.name}`).join('\n')
    : '';

  return [
    'My Aahar Sathi plan 🍛',
    `Daily target: ${plan.targets.calories} kcal · ${plan.targets.protein} g protein`,
    `Water: ${plan.targets.waterGlasses} glasses (${litres(plan.targets.waterGlasses)})`,
    '',
    `Today (${day?.day ?? ''}):`,
    meals,
    '',
    'Get your own at aaharsathi.in',
  ].join('\n');
}

export function PlanActions({ plan, serverToday }: { plan: Plan; serverToday: string }) {
  const router = useRouter();
  const toast = useToast();
  const today = weekdayFromKey(useLocalToday(serverToday));
  const [pending, startTransition] = useTransition();

  const shuffle = () => {
    startTransition(async () => {
      try {
        await api.post<PlanResponse>(`/plans/${plan.id}/shuffle`);
        router.refresh();
        toast.success('Fresh meals for the week');
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not shuffle this week.');
      }
    });
  };

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(planAsText(plan));
      toast.success('Plan copied to your clipboard');
    } catch {
      toast.error('Your browser would not let us copy. Try selecting the text instead.');
    }
  };

  return (
    <div data-print="hide" className="no-print flex w-full items-center gap-2 sm:w-auto">
      <Button onClick={shuffle} pending={pending} variant="secondary" size="sm" className="flex-1 sm:flex-none">
        <Shuffle className="size-4 text-muted" aria-hidden="true" />
        Shuffle week
      </Button>
      <ShareMenu
        onPrint={() => window.print()}
        whatsappHref={`https://wa.me/?text=${encodeURIComponent(todaySummary(plan, today))}`}
        onCopy={copyPlan}
      />
    </div>
  );
}

const menuItem =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface-3 focus-visible:bg-surface-3';

/**
 * A disclosure menu: Escape and outside clicks close it, focus returns to the
 * trigger, and choosing an item closes it — so keyboard and pointer users get the
 * same behaviour.
 */
function ShareMenu({ onPrint, whatsappHref, onCopy }: { onPrint: () => void; whatsappHref: string; onCopy: () => void }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const choose = (action: () => void) => () => {
    setOpen(false);
    triggerRef.current?.focus();
    action();
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      // Tabbing out of the open menu closes it rather than leaving it hanging.
      onBlur={(event) => {
        if (open && !wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Button
        ref={triggerRef}
        onClick={() => setOpen((value) => !value)}
        variant="secondary"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Share2 className="size-4 text-muted" aria-hidden="true" />
        Share
        <ChevronDown className={`size-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </Button>

      {open ? (
        <div
          id={panelId}
          className="surface-raised absolute right-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] p-1.5 animate-fade"
        >
          <ul>
            <li>
              <button ref={firstItemRef} type="button" className={menuItem} onClick={choose(onPrint)}>
                <Printer className="size-4 text-muted" aria-hidden="true" />
                Print or save as PDF
              </button>
            </li>
            <li>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={menuItem}
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <MessageCircle className="size-4 text-muted" aria-hidden="true" />
                Share today on WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <button type="button" className={menuItem} onClick={choose(onCopy)}>
                <ClipboardCopy className="size-4 text-muted" aria-hidden="true" />
                Copy the week as text
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
