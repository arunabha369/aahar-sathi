import Image from 'next/image';
import { cn } from '@/lib/utils';

const frame = (className?: string) => cn('h-auto w-full rounded-2xl object-cover', className);

/** Step 1 — the profile form. */
export function ProfileScene({ className }: { className?: string }) {
  return (
    <Image
      src="/images/profile-scene.jpg"
      alt="Profile setup form illustration"
      width={672}
      height={504}
      className={frame(className)}
    />
  );
}

/** Step 2 — the calculation. */
export function MathsScene({ className }: { className?: string }) {
  return (
    <Image
      src="/images/maths-scene.jpg"
      alt="Nutrition calculation dashboard illustration"
      width={672}
      height={504}
      className={frame(className)}
    />
  );
}

/** Step 3 — the week of meals. */
export function PlanScene({ className }: { className?: string }) {
  return (
    <Image
      src="/images/plan-scene.jpg"
      alt="Weekly meal plan illustration"
      width={672}
      height={504}
      className={frame(className)}
    />
  );
}

const emptyFrame = (className?: string) => cn(className ?? 'h-auto w-40', 'object-contain');

export function EmptyPlate({ className }: { className?: string }) {
  return (
    <Image
      src="/images/empty-plate.jpg"
      alt="Empty plate illustration"
      width={400}
      height={400}
      className={emptyFrame(className)}
    />
  );
}

export function EmptyBasket({ className }: { className?: string }) {
  return (
    <Image
      src="/images/empty-basket.jpg"
      alt="Empty shopping basket illustration"
      width={400}
      height={400}
      className={emptyFrame(className)}
    />
  );
}

export function EmptyTrend({ className }: { className?: string }) {
  return (
    <Image
      src="/images/empty-trend.jpg"
      alt="Empty trend chart illustration"
      width={400}
      height={400}
      className={emptyFrame(className)}
    />
  );
}
