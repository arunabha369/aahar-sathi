import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * A top-down thali: rotis, rice, dal, sabzi and curd on a steel plate.
 * Now uses a real food-photography image instead of an SVG vector.
 */
export function Thali({ className, idPrefix: _idPrefix = 'thali' }: { className?: string; idPrefix?: string }) {
  return (
    <Image
      src="/images/hero-thali.jpg"
      alt="An Indian thali with rotis, rice, dal, vegetables and curd"
      width={800}
      height={800}
      priority
      className={cn('size-full rounded-full object-cover', className)}
    />
  );
}
