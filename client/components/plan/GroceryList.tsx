'use client';

import { useOptimistic, useTransition } from 'react';
import { Check } from 'lucide-react';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import type { GroceryGroup, GroceryUpdateResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GroceryListProps {
  planId: string;
  groups: GroceryGroup[];
  total: number;
  checked: string[];
}

export function GroceryList({ planId, groups, total, checked }: GroceryListProps) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [optimisticChecked, toggleOptimistic] = useOptimistic(
    checked,
    (current: string[], item: string) =>
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
  );

  const toggle = (item: string) => {
    const nextChecked = !optimisticChecked.includes(item);
    startTransition(async () => {
      toggleOptimistic(item);
      try {
        await api.patch<GroceryUpdateResponse>(`/plans/${planId}/grocery`, { item, checked: nextChecked });
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not save that tick.');
      }
    });
  };

  const bought = optimisticChecked.length;
  const percent = total === 0 ? 0 : Math.round((bought / total) * 100);
  const remaining = total - bought;

  return (
    <div>
      <div className="surface sticky top-16 z-20 mb-5 flex flex-wrap items-center gap-4 p-4 lg:top-4" data-print="hide">
        <div className="min-w-32">
          <p className="text-sm font-semibold text-muted">
            <span className="text-2xl font-extrabold leading-none text-ink tabular-nums">{bought}</span>
            <span className="text-ink">/{total}</span> bought
          </p>
          <p className={cn('mt-1 text-xs font-bold', remaining === 0 ? 'text-brand-800' : 'text-muted')}>
            {remaining === 0 ? 'Shopping complete' : `${remaining} ${remaining === 1 ? 'item' : 'items'} left`}
          </p>
        </div>
        <div
          className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-canvas"
          role="progressbar"
          aria-label="Grocery items bought"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={bought}
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-sm font-bold text-brand-800 tabular-nums">{percent}%</p>
      </div>

      {/* Columns rather than a grid, so short and long aisles pack without gaps. */}
      <div className="columns-1 gap-5 md:columns-2 xl:columns-3 [&>*]:mb-5">
        {groups.map((group) => {
          const groupChecked = group.items.filter((item) => optimisticChecked.includes(item)).length;
          const done = groupChecked === group.items.length;

          return (
            <section key={group.category} className="surface break-inside-avoid p-4" data-print="card">
              <h2 className="mb-3 flex items-center gap-2.5 border-b border-line pb-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-canvas ring-1 ring-line">
                  <CategoryIcon category={group.category} className="size-5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-bold text-ink">
                  {group.category}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums',
                    done ? 'bg-brand-50 text-brand-800' : 'bg-canvas text-muted',
                  )}
                >
                  {groupChecked}/{group.items.length}
                </span>
              </h2>

              <ul>
                {group.items.map((item) => {
                  const isChecked = optimisticChecked.includes(item);
                  return (
                    <li key={item}>
                      <label
                        className={cn(
                          'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1.5 transition-colors hover:bg-canvas',
                          isChecked && 'text-muted',
                        )}
                      >
                        <input type="checkbox" checked={isChecked} onChange={() => toggle(item)} className="peer sr-only" />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'grid size-[1.375rem] shrink-0 place-items-center rounded-[0.35rem] border-2 transition-colors',
                            isChecked ? 'border-brand-700 bg-brand-700' : 'border-line-strong bg-white',
                            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-700 peer-focus-visible:ring-offset-2',
                          )}
                        >
                          {isChecked ? <Check className="size-3.5 text-white" strokeWidth={3.5} /> : null}
                        </span>
                        <span className={cn('text-[0.875rem] font-medium', isChecked && 'line-through')}>{item}</span>
                      </label>
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
