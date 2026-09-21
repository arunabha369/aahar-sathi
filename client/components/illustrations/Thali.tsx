import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * A top-down thali: rotis, rice, dal, sabzi and curd on a steel plate.
 * Now uses a real food-photography image instead of an SVG vector.
 */
export function Thali({
  className,
  priority = false,
}: {
  className?: string;
  /** Preload only when the thali is the largest image above the fold. */
  priority?: boolean;
}) {
  return (
    <Image
      src="/images/hero-thali.webp"
      alt="An Indian thali with rotis, rice, dal, vegetables and curd"
      width={1000}
      height={1000}
      preload={priority}
      sizes="(max-width: 640px) 20rem, (max-width: 1024px) 26rem, 28rem"
      className={cn('h-auto w-full rounded-full object-cover', className)}
    />
  );
}
