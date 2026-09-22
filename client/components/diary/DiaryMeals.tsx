'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SLOT_META } from '@/lib/constants';
import { formatQuantity } from '@/lib/format';
import type { useDiary } from '@/lib/useDiary';
import type { FoodEntry, PlanSlot } from '@/lib/types';
import { AddFoodSheet } from './AddFoodSheet';
import { CheckinControl } from './CheckinControl';

type Diary = ReturnType<typeof useDiary>;

function EntryRow({ entry, onRemove }: { entry: FoodEntry; onRemove: () => void }) {
  const amount = entry.servingLabel === '100 g' || entry.servingLabel === '100 ml'
    ? `${Math.round(entry.servings * 100)} ${entry.servingLabel.slice(4)}`
    : `${formatQuantity(entry.servings)} × ${entry.servingLabel}`;
  return (
    <li className="flex items-center gap-2 rounded-xl bg-surface-2 py-1 pl-3 pr-1">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{entry.name}</span>
        <span className="block text-xs text-muted tabular-nums">
          {amount} · {Math.round(entry.kcal)} kcal
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${entry.name}`}
        className="grid size-11 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-chilli-600"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * The day's planned meals, each with Ate / Skipped / Other, the foods logged in place of
 * them, anything else eaten, and the Add food sheet.
 */
export function DiaryMeals({ diary, canLog }: { diary: Diary; canLog: boolean }) {
  const { day } = diary;
  const [sheet, setSheet] = useState<{ open: boolean; replacing: { slot: PlanSlot; mealName: string } | null }>({
    open: false,
    replacing: null,
  });
  const extras = day.entries.filter((entry) => !entry.slot);

  return (
    <div>
      {day.planned.length > 0 ? (
        <ol className="space-y-3" aria-label="Planned meals">
          {day.planned.map((meal) => {
            const instead = day.entries.filter((entry) => entry.slot === meal.slot);
            return (
              <li key={meal.slot} className="rounded-2xl bg-surface-2/60 p-3 ring-1 ring-line">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0">
                    <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted">
                      {SLOT_META[meal.slot].label} · {meal.time}
                    </span>
                    <span className={meal.status === 'swapped' || meal.status === 'skipped' ? 'block truncate text-sm font-semibold text-muted line-through decoration-1' : 'block truncate text-sm font-semibold text-ink'}>
                      {meal.name}
                    </span>
                  </p>
                  <span className="shrink-0 text-xs font-bold text-muted tabular-nums">{meal.kcal} kcal</span>
                </div>
                {canLog ? (
                  <div className="mt-2.5">
                    <CheckinControl
                      status={meal.status}
                      mealName={meal.name}
                      onEaten={() => diary.checkIn(meal.slot, 'eaten')}
                      onSkipped={() => diary.checkIn(meal.slot, 'skipped')}
                      onClear={() => diary.clearCheckIn(meal.slot)}
                      onOther={() => setSheet({ open: true, replacing: { slot: meal.slot, mealName: meal.name } })}
                    />
                  </div>
                ) : null}
                {instead.length > 0 ? (
                  <div className="mt-2.5">
                    <p className="mb-1.5 text-xs font-semibold text-water-700">Ate instead</p>
                    <ul className="space-y-1.5">
                      {instead.map((entry) => (
                        <EntryRow key={entry.id} entry={entry} onRemove={() => diary.removeEntry(entry.id)} />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted">No plan for this day — log what you ate below.</p>
      )}

      {extras.length > 0 ? (
        <section aria-label="Also eaten" className="mt-4">
          <p className="eyebrow mb-2">Also eaten</p>
          <ul className="space-y-1.5">
            {extras.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onRemove={() => diary.removeEntry(entry.id)} />
            ))}
          </ul>
        </section>
      ) : null}

      {canLog ? (
        <Button variant="secondary" fullWidth className="mt-4" onClick={() => setSheet({ open: true, replacing: null })}>
          <Plus className="size-4" aria-hidden="true" />
          Add food
        </Button>
      ) : null}

      <AddFoodSheet
        open={sheet.open}
        replacing={sheet.replacing}
        onClose={() => setSheet({ open: false, replacing: null })}
        onAdd={(entry) => diary.addEntry(entry, sheet.replacing ? 'Swap saved' : 'Added to your diary')}
      />
    </div>
  );
}
