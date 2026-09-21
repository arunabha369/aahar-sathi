import Image from 'next/image';
import { cn } from '@/lib/utils';

const emptyFrame = (className?: string) => cn(className ?? 'h-auto w-40', 'object-contain');

export function EmptyPlate({ className }: { className?: string }) {
  return (
    <Image
      src="/images/empty-plate.jpg"
      alt=""
      width={400}
      height={400}
      sizes="160px"
      className={emptyFrame(className)}
    />
  );
}

export function EmptyBasket({ className }: { className?: string }) {
  return (
    <Image
      src="/images/empty-basket.jpg"
      alt=""
      width={400}
      height={400}
      sizes="160px"
      className={emptyFrame(className)}
    />
  );
}

export function EmptyTrend({ className }: { className?: string }) {
  return (
    <Image
      src="/images/empty-trend.jpg"
      alt=""
      width={400}
      height={400}
      sizes="160px"
      className={emptyFrame(className)}
    />
  );
}
