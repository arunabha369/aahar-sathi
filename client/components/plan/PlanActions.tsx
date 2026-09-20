'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCopy, Printer, Share2, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { SLOT_META } from '@/lib/constants';
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
      const slot = SLOT_META[meal.slot];
      lines.push(
        `  ${slot.time} ${slot.label}: ${meal.name} (${meal.items
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
    ? day.meals.map((meal) => `${SLOT_META[meal.slot].time} — ${meal.name}`).join('\n')
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
    <div data-print="hide" className="no-print flex flex-wrap gap-2">
      <Button onClick={shuffle} pending={pending} variant="secondary" size="sm">
        <Shuffle className="size-4 text-muted" aria-hidden="true" />
        Shuffle week
      </Button>
      <Button onClick={() => window.print()} variant="secondary" size="sm">
        <Printer className="size-4 text-muted" aria-hidden="true" />
        Download PDF
      </Button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(todaySummary(plan, today))}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 text-[0.8125rem] font-semibold text-ink shadow-xs ring-1 ring-line transition-colors hover:bg-canvas hover:ring-line-strong"
      >
        <Share2 className="size-4 text-muted" aria-hidden="true" />
        Share
      </a>
      <Button onClick={copyPlan} variant="secondary" size="sm">
        <ClipboardCopy className="size-4 text-muted" aria-hidden="true" />
        Copy plan
      </Button>
    </div>
  );
}
