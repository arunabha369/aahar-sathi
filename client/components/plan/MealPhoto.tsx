import Image from 'next/image';
import { SlotIcon } from '@/components/illustrations/SlotIcon';
import { mealPhotoSrc } from '@/lib/mealPhotos';
import type { PlanSlot, Region } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MealPhotoProps {
  slug: string;
  slot: PlanSlot;
  /** Sets the rendered size; the photo and the fallback tile share it. */
  className: string;
  /** Rendered width in CSS pixels, so next/image picks the right source. */
  sizes: string;
  /** Tints the fallback tile by where the dish comes from. */
  region?: Region;
  /** Above-the-fold photos (the Today card's) load eagerly: they are the page's LCP. */
  eager?: boolean;
}

/** A soft wash per region, so a wall of dishes without photos still reads as a menu. */
const REGION_WASH: Record<Region, string> = {
  north: 'from-saffron-100 to-saffron-50',
  south: 'from-brand-100 to-brand-50',
  east: 'from-water-100 to-water-50',
  west: 'from-chilli-100 to-chilli-50',
  pan: 'from-surface-3 to-surface-2',
};

/** The dish photo when there is one, otherwise a tinted tile with its meal icon — never a gap. */
export function MealPhoto({ slug, slot, className, sizes, region, eager = false }: MealPhotoProps) {
  const src = mealPhotoSrc(slug);
  if (!src) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br ring-1 ring-line',
          REGION_WASH[region ?? 'pan'],
          className,
        )}
      >
        <SlotIcon slot={slot} className="size-[55%] bg-transparent ring-0" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn('relative block shrink-0 overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line', className)}
    >
      {/* Decorative: the dish name is already in the heading beside it. */}
      <Image src={src} alt="" fill sizes={sizes} loading={eager ? 'eager' : undefined} className="object-cover" />
    </span>
  );
}
