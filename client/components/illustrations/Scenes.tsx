import { ShoppingBasket, TrendingUp, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A lime-lit icon inside two concentric rings: the empty-state art, drawn as vectors. */
function Scene({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative grid aspect-square place-items-center', className ?? 'w-40')}>
      <span className="absolute inset-0 rounded-full border border-dashed border-line-strong" />
      <span className="absolute inset-[16%] rounded-full bg-brand-50 ring-1 ring-brand-200" />
      <Icon className="relative size-[30%] text-accent" strokeWidth={1.6} />
    </span>
  );
}

export function EmptyPlate({ className }: { className?: string }) {
  return <Scene icon={UtensilsCrossed} className={className} />;
}

export function EmptyBasket({ className }: { className?: string }) {
  return <Scene icon={ShoppingBasket} className={className} />;
}

export function EmptyTrend({ className }: { className?: string }) {
  return <Scene icon={TrendingUp} className={className} />;
}
