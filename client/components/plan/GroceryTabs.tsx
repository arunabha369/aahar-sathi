import Link from 'next/link';
import { ChefHat, ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/grocery', label: 'Shopping list', icon: ShoppingBasket },
  { href: '/grocery/prep', label: 'Sunday prep', icon: ChefHat },
] as const;

/** Switches between the week's shopping and its batch-cooking plan. */
export function GroceryTabs({ current }: { current: (typeof TABS)[number]['href'] }) {
  return (
    <nav aria-label="Grocery views" className="mb-6 flex gap-1.5 rounded-2xl bg-surface-2 p-1.5 ring-1 ring-line sm:w-fit" data-print="hide">
      {TABS.map((tab) => {
        const active = tab.href === current;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors sm:flex-none',
              active ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:bg-surface-3 hover:text-ink',
            )}
          >
            <tab.icon className="size-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
