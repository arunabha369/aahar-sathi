import Image from 'next/image';
import type { PlanSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SlotIconProps {
  slot: PlanSlot;
  className?: string;
}

const SLOT_IMAGES: Record<PlanSlot, string> = {
  breakfast: '/images/slot-breakfast.jpg',
  midMorning: '/images/slot-midmorning.jpg',
  lunch: '/images/slot-lunch.jpg',
  eveningSnack: '/images/slot-eveningsnack.jpg',
  dinner: '/images/slot-dinner.jpg',
};

/** One icon per meal slot — sunrise, fruit, thali, chai, moon. */
export function SlotIcon({ slot, className = 'size-8' }: SlotIconProps) {
  const src = SLOT_IMAGES[slot] ?? SLOT_IMAGES.dinner;

  return (
    <span
      aria-hidden="true"
      className={cn('relative block shrink-0 overflow-hidden rounded-xl bg-canvas ring-1 ring-line', className)}
    >
      <Image src={src} alt="" fill sizes="48px" className="scale-[1.4] object-cover" />
    </span>
  );
}
