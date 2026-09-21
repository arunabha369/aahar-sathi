import { Apple, Coffee, Moon, Sunrise, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { PlanSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SlotIconProps {
  slot: PlanSlot;
  className?: string;
}

const SLOT_ICONS: Record<PlanSlot, { icon: LucideIcon; tone: string }> = {
  breakfast: { icon: Sunrise, tone: 'bg-saffron-50 text-saffron-600' },
  midMorning: { icon: Apple, tone: 'bg-chilli-50 text-chilli-600' },
  lunch: { icon: UtensilsCrossed, tone: 'bg-brand-50 text-brand-600' },
  eveningSnack: { icon: Coffee, tone: 'bg-saffron-50 text-saffron-700' },
  dinner: { icon: Moon, tone: 'bg-water-50 text-water-600' },
};

/** One vector icon per meal slot — sunrise, fruit, thali, chai, moon — tinted for the dark theme. */
export function SlotIcon({ slot, className = 'size-8' }: SlotIconProps) {
  const { icon: Icon, tone } = SLOT_ICONS[slot] ?? SLOT_ICONS.dinner;

  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center rounded-xl ring-1 ring-line', tone, className)}
    >
      <Icon className="size-[42%]" strokeWidth={1.75} />
    </span>
  );
}
