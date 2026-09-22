'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { ApiError, api } from '@/lib/api/client';
import type { FoodSearchResponse } from '@/lib/types';
import type { PickedFood } from './foodTypes';

function ResultButton({ name, detail, onClick }: { name: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
    >
      <span className="min-w-0 text-sm font-semibold text-ink">{name}</span>
      <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">{detail}</span>
    </button>
  );
}

/** Searches the meal list and the user's own foods as they type. */
export function FoodSearchTab({ onPick }: { onPick: (food: PickedFood) => void }) {
  const [query, setQuery] = useState('');
  // Results remember which query they answer, so stale ones are never shown for a new query.
  const [results, setResults] = useState<(FoodSearchResponse & { query: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    // Wait for a pause in typing before searching.
    const timer = setTimeout(() => {
      api
        .get<FoodSearchResponse>(`/foods/search?q=${encodeURIComponent(trimmed)}`)
        .then((found) => {
          if (!cancelled) {
            setResults({ ...found, query: trimmed });
            setError(null);
          }
        })
        .catch((reason: unknown) => {
          if (!cancelled) setError(reason instanceof ApiError ? reason.message : 'Search is not working right now.');
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  const shown = trimmed.length >= 2 && results?.query === trimmed ? results : null;
  const searching = trimmed.length >= 2 && !shown && !error;
  const nothing = shown && shown.meals.length === 0 && shown.custom.length === 0;

  return (
    <div>
      <Field
        label="Search dishes"
        name="food-search"
        type="search"
        autoComplete="off"
        placeholder="Poha, dal, paneer…"
        // Searching is what the sheet is for: the sheet focuses this once it has opened.
        data-autofocus
        leading={<Search className="size-4" aria-hidden="true" />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="mt-3" aria-live="polite">
        {error ? <p className="px-1 text-sm font-semibold text-chilli-700">{error}</p> : null}
        {searching ? <p className="px-1 text-sm text-muted">Searching…</p> : null}
        {trimmed.length < 2 ? (
          <p className="px-1 text-sm text-muted">Type at least two letters to search the 82 dishes and your own foods.</p>
        ) : nothing ? (
          <p className="px-1 text-sm text-muted">
            Nothing called “{trimmed}” yet. Add it under <strong className="font-bold text-ink">My foods</strong>, or scan its
            barcode.
          </p>
        ) : shown ? (
          <div className="space-y-3">
            {shown.custom.length > 0 ? (
              <section aria-label="Your foods">
                <p className="eyebrow mb-1 px-1">Your foods</p>
                {shown.custom.map((food) => (
                  <ResultButton
                    key={food.id}
                    name={food.name}
                    detail={`${Math.round(food.kcal)} kcal · ${food.servingLabel}`}
                    onClick={() => onPick({ kind: 'custom', ref: food.id, name: food.name, servingLabel: food.servingLabel, per: food })}
                  />
                ))}
              </section>
            ) : null}
            {shown.meals.length > 0 ? (
              <section aria-label="Dishes">
                <p className="eyebrow mb-1 px-1">Dishes</p>
                {shown.meals.map((meal) => (
                  <ResultButton
                    key={meal.slug}
                    name={meal.name}
                    detail={`${Math.round(meal.kcal)} kcal · 1 serving`}
                    onClick={() => onPick({ kind: 'meal', ref: meal.slug, name: meal.name, servingLabel: 'serving', per: meal })}
                  />
                ))}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
