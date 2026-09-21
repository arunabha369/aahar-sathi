import Image from 'next/image';
import { SlotIcon } from '@/components/illustrations/SlotIcon';
import { mealPhotoSrc } from '@/lib/mealPhotos';
import type { PlanSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MealPhotoProps {
  slug: string;
  slot: PlanSlot;
  /** Sets the rendered size; the photo and the fallback icon share it. */
  className: string;
  /** Rendered width in CSS pixels, so next/image picks the right source. */
  sizes: string;
  /** Above-the-fold photos (the Today card's) load eagerly: they are the page's LCP. */
  eager?: boolean;
}

/** The dish photo when there is one, otherwise the slot's icon — never a broken image. */
export function MealPhoto({ slug, slot, className, sizes, eager = false }: MealPhotoProps) {
  const src = mealPhotoSrc(slug);
  if (!src) return <SlotIcon slot={slot} className={className} />;

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
