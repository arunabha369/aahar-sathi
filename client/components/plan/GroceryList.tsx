'use client';

import { useOptimistic, useTransition } from 'react';
import { Check, House } from 'lucide-react';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import type { GroceryGroup, GroceryUpdateResponse, PantryResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GroceryListProps {
  planId: string;
  groups: GroceryGroup[];
  total: number;
  checked: string[];
  atHome: string[];
  servings: number;
}

const toggleIn = (current: string[], item: string) =>
  current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item];

export function GroceryList({ planId, groups, total, checked, atHome, servings }: GroceryListProps) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [optimisticChecked, toggleChecked] = useOptimistic(checked, toggleIn);
  const [optimisticHome, toggleHome] = useOptimistic(atHome, toggleIn);

  const toggleBought = (item: string) => {
    const nextChecked = !optimisticChecked.includes(item);
    startTransition(async () => {
      toggleChecked(item);
      try {
        await api.patch<GroceryUpdateResponse>(`/plans/${planId}/grocery`, { item, checked: nextChecked });
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not save that tick.');
      }
    });
  };

  const toggleAtHome = (item: string) => {
    const nextAtHome = !optimisticHome.includes(item);
    startTransition(async () => {
      toggleHome(item);
      try {
        await api.put<PantryResponse>('/pantry', { item, atHome: nextAtHome });
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not save that.');
      }
    });
  };

  // What is at home doesn't need buying, so it drops out of the count.
  const home = new Set(optimisticHome);
  const toBuy = total - home.size;
  const bought = optimisticChecked.filter((item) => !home.has(item)).length;
  const percent = toBuy === 0 ? 100 : Math.round((bought / toBuy) * 100);
  const remaining = toBuy - bought;

  return (
    <div>
      <div className="surface sticky top-16 z-20 mb-5 flex flex-wrap items-center gap-4 p-4 lg:top-4" data-print="hide">
        <div className="min-w-32">
          <p className="text-sm font-semibold text-muted">
            <span className="text-2xl font-extrabold leading-none text-ink tabular-nums">{bought}</span>
            <span className="text-ink">/{toBuy}</span> bought
          </p>
          <p className={cn('mt-1 text-xs font-bold', remaining === 0 ? 'text-brand-800' : 'text-muted')}>
            {remaining === 0 ? 'Shopping complete' : `${remaining} ${remaining === 1 ? 'item' : 'items'} left`}
            {home.size > 0 ? ` · ${home.size} at home` : ''}
          </p>
        </div>
        <div
          className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-label="Grocery items bought"
          aria-valuemin={0}
          aria-valuemax={toBuy}
          aria-valuenow={bought}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-sm font-bold text-brand-800 tabular-nums">{percent}%</p>
      </div>

      <p className="mb-4 flex items-start gap-2 text-[0.8125rem] leading-relaxed text-muted" data-print="hide">
        <House className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
        <span>
          Amounts are for {servings === 1 ? 'you' : `${servings} people`} for the whole week, rounded up. Tap the house on
          anything you already have — it stays marked for next week too.
        </span>
      </p>

      {/* Columns rather than a grid, so short and long aisles pack without gaps. */}
      <div className="columns-1 gap-5 md:columns-2 xl:columns-3 [&>*]:mb-5">
        {groups.map((group) => {
          const needed = group.items.filter((item) => !home.has(item.name));
          const groupBought = needed.filter((item) => optimisticChecked.includes(item.name)).length;
          const done = groupBought === needed.length;
          // Things at home sink to the bottom of their aisle.
          const ordered = [...needed, ...group.items.filter((item) => home.has(item.name))];

          return (
            <section key={group.category} className="surface break-inside-avoid p-4" data-print="card">
              <h2 className="mb-2 flex items-center gap-2.5 border-b border-line pb-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 ring-1 ring-line">
                  <CategoryIcon category={group.category} className="size-5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-bold text-ink">{group.category}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums',
                    done ? 'bg-brand-50 text-brand-800' : 'bg-surface-2 text-muted',
                  )}
                >
                  {groupBought}/{needed.length}
                </span>
              </h2>

              <ul>
                {ordered.map((item) => {
                  const isHome = home.has(item.name);
                  const isChecked = !isHome && optimisticChecked.includes(item.name);
                  return (
                    <li key={item.name} className="flex items-center gap-1">
                      <label
                        className={cn(
                          'flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1 transition-colors',
                          isHome ? 'cursor-default text-muted' : 'cursor-pointer hover:bg-surface-2',
                          isChecked && 'text-muted',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isHome}
                          onChange={() => toggleBought(item.name)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'grid size-[1.375rem] shrink-0 place-items-center rounded-[0.35rem] border-2 transition-colors',
                            isChecked ? 'border-accent bg-accent' : 'border-line-strong bg-surface-2',
                            isHome && 'border-dashed opacity-50',
                            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-700 peer-focus-visible:ring-offset-2',
                          )}
                        >
                          {isChecked ? <Check className="size-3.5 text-accent-ink" strokeWidth={3.5} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block text-[0.875rem] font-medium', (isChecked || isHome) && 'line-through')}>
                            {item.name}
                          </span>
                          {item.amount || isHome ? (
                            <span className="block text-[0.75rem] font-semibold text-muted tabular-nums">
                              {isHome ? 'At home' : item.amount}
                              {!isHome && item.detail ? <span className="font-normal"> · {item.detail}</span> : null}
                            </span>
                          ) : null}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleAtHome(item.name)}
                        aria-pressed={isHome}
                        aria-label={`${item.name}: have it at home`}
                        title={isHome ? 'Marked as at home' : 'Have it at home'}
                        data-print="hide"
                        className={cn(
                          'grid size-11 shrink-0 place-items-center rounded-xl transition-colors',
                          isHome ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200' : 'text-muted hover:bg-surface-2 hover:text-ink',
                        )}
                      >
                        <House className="size-[1.125rem]" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
