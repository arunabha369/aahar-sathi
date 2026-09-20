import Image from 'next/image';
import type { PlanSlot } from '@/lib/types';

interface SlotIconProps {
  slot: PlanSlot;
  className?: string;
}

const SLOT_IMAGES: Record<PlanSlot, { src: string; alt: string }> = {
  breakfast: { src: '/images/slot-breakfast.jpg', alt: 'Sunrise — breakfast' },
  midMorning: { src: '/images/slot-midmorning.jpg', alt: 'Apple — mid-morning snack' },
  lunch: { src: '/images/slot-lunch.jpg', alt: 'Thali plate — lunch' },
  eveningSnack: { src: '/images/slot-eveningsnack.jpg', alt: 'Chai cup — evening snack' },
  dinner: { src: '/images/slot-dinner.jpg', alt: 'Crescent moon — dinner' },
};

/** One icon per meal slot — sunrise, fruit, thali, chai, moon. */
export function SlotIcon({ slot, className = 'size-8' }: SlotIconProps) {
  const { src, alt } = SLOT_IMAGES[slot] ?? SLOT_IMAGES.dinner;
  return (
    <Image
      src={src}
      alt={alt}
      width={64}
      height={64}
      className={`${className} rounded-lg object-cover`}
    />
  );
}
