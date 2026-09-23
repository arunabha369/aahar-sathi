'use client';

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Clock, Heart, Search, SlidersHorizontal, X } from 'lucide-react';
import { MealPhoto } from '@/components/plan/MealPhoto';
import { DietMark } from '@/components/recipes/DietMark';
import { ICON_SLOT, SLOT_LABELS, TAG_LABELS } from '@/components/recipes/recipeMeta';
import { Button } from '@/components/ui/Button';
import { inputShell } from '@/components/ui/Field';
import type { Diet, MealSlot, MealTag, RecipeSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

type SlotFilter = MealSlot | 'all';
type Extra = 'saved' | 'vrat' | 'jain' | 'iftar' | 'sehri' | 'quick';

const SLOT_FILTERS: { value: SlotFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

const DIET_FILTERS: { value: Diet; label: string }[] = [
  { value: 'veg', label: 'Veg' },
  { value: 'egg', label: 'Egg' },
  { value: 'nonveg', label: 'Non-veg' },
];

const EXTRA_FILTERS: { value: Extra; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'quick', label: 'Under 20 min' },
  { value: 'vrat', label: 'Vrat' },
  { value: 'jain', label: 'Jain-friendly' },
  { value: 'sehri', label: 'Sehri' },
  { value: 'iftar', label: 'Iftar' },
];

const QUICK_MINUTES = 20;

/** One choice in the filter sheet. */
function Choice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-[0.8125rem] font-semibold transition-colors',
        pressed ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-soft ring-1 ring-line hover:bg-surface-3 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

/** An active filter, shown under the search box and removable with one tap. */
function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-50 px-3 text-xs font-bold text-brand-800 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
    >
      {label}
      <X className="size-3.5" aria-hidden="true" />
    </button>
  );
}

export function RecipeBrowser({ recipes, favourites }: { recipes: RecipeSummary[]; favourites: string[] }) {
  const saved = useMemo(() => new Set(favourites), [favourites]);
  const [query, setQuery] = useState('');
  const [slot, setSlot] = useState<SlotFilter>('all');
  const [diets, setDiets] = useState<Diet[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (sheetOpen && !dialog.open) dialog.showModal();
    if (!sheetOpen && dialog.open) dialog.close();
  }, [sheetOpen]);

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]);

  const shown = useMemo(() => {
    const words = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return recipes.filter((recipe) => {
      if (slot !== 'all' && recipe.slot !== slot) return false;
      if (diets.length > 0 && !diets.includes(recipe.diet)) return false;
      for (const extra of extras) {
        if (extra === 'quick' && recipe.minutes > QUICK_MINUTES) return false;
        if (extra === 'saved' && !saved.has(recipe.slug)) return false;
        if (extra !== 'quick' && extra !== 'saved' && !recipe.tags.includes(extra as MealTag)) return false;
      }
      const name = recipe.name.toLowerCase();
      return words.every((word) => name.includes(word));
    });
  }, [recipes, deferredQuery, slot, diets, extras, saved]);

  const chosen = (slot === 'all' ? 0 : 1) + diets.length + extras.length;
  const clearAll = () => {
    setSlot('all');
    setDiets([]);
    setExtras([]);
  };

  return (
    <div>
      {/* One line: search, and everything else behind a button — the recipes stay in view. */}
      <div className="mb-3 flex gap-2">
        <label className="relative block min-w-0 flex-1 cursor-text">
          <span className="sr-only">Search recipes</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search dishes"
            className={cn(inputShell, 'border-line pl-10 hover:border-line-strong focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15')}
          />
        </label>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          className="shrink-0"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          <span className="sr-only sm:hidden">Filters</span>
          {chosen > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.6875rem] font-extrabold text-accent-ink tabular-nums">
              {chosen}
            </span>
          ) : null}
        </Button>
      </div>

      {chosen > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {slot !== 'all' ? (
            <ActivePill label={SLOT_FILTERS.find((option) => option.value === slot)!.label} onRemove={() => setSlot('all')} />
          ) : null}
          {diets.map((diet) => (
            <ActivePill
              key={diet}
              label={DIET_FILTERS.find((option) => option.value === diet)!.label}
              onRemove={() => setDiets(toggle(diets, diet))}
            />
          ))}
          {extras.map((extra) => (
            <ActivePill
              key={extra}
              label={EXTRA_FILTERS.find((option) => option.value === extra)!.label}
              onRemove={() => setExtras(toggle(extras, extra))}
            />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-9 items-center rounded-full px-2.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <p className="mb-3 text-sm font-semibold text-muted" aria-live="polite">
        {shown.length} {shown.length === 1 ? 'recipe' : 'recipes'}
      </p>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setSheetOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSheetOpen(false);
        }}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-3xl border border-line bg-surface p-0 text-ink shadow-[var(--shadow-lg)] backdrop:bg-black/70 open:animate-rise sm:m-auto sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <h2 id={titleId} className="text-lg font-bold text-ink">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="Close"
              className="-mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-5 overflow-y-auto px-5 py-4">
            <fieldset>
              <legend className="mb-2 text-[0.8125rem] font-semibold text-ink-soft">Meal</legend>
              <div className="grid grid-cols-3 gap-2">
                {SLOT_FILTERS.map((option) => (
                  <Choice key={option.value} pressed={slot === option.value} onClick={() => setSlot(option.value)}>
                    {option.label}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[0.8125rem] font-semibold text-ink-soft">Diet</legend>
              <div className="grid grid-cols-3 gap-2">
                {DIET_FILTERS.map((option) => (
                  <Choice key={option.value} pressed={diets.includes(option.value)} onClick={() => setDiets(toggle(diets, option.value))}>
                    <DietMark diet={option.value} className="size-3.5" />
                    {option.label}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[0.8125rem] font-semibold text-ink-soft">More</legend>
              <div className="grid grid-cols-2 gap-2">
                {EXTRA_FILTERS.map((option) => (
                  <Choice key={option.value} pressed={extras.includes(option.value)} onClick={() => setExtras(toggle(extras, option.value))}>
                    {option.label}
                  </Choice>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex items-center gap-2 border-t border-line px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
            <Button variant="ghost" onClick={clearAll} disabled={chosen === 0}>
              Clear all
            </Button>
            <Button fullWidth onClick={() => setSheetOpen(false)} className="flex-1">
              {shown.length === 0 ? 'Nothing matches — go back' : `Show ${shown.length} ${shown.length === 1 ? 'recipe' : 'recipes'}`}
            </Button>
          </div>
        </div>
      </dialog>

      {shown.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-muted">No recipe matches all of those.</p>
          <Button variant="secondary" size="sm" onClick={clearAll}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((recipe) => (
            <li key={recipe.slug}>
              <Link
                href={`/recipes/${recipe.slug}`}
                className="surface flex h-full items-start gap-3.5 p-3.5 transition-colors hover:bg-surface-2"
              >
                <MealPhoto slug={recipe.slug} slot={ICON_SLOT[recipe.slot]} region={recipe.region} className="size-16" sizes="64px" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <DietMark diet={recipe.diet} className="mt-0.5" />
                    <span className="min-w-0 flex-1 text-[0.9375rem] font-bold leading-snug text-ink">{recipe.name}</span>
                    {saved.has(recipe.slug) ? (
                      <Heart className="mt-0.5 size-4 shrink-0 fill-chilli-500 text-chilli-500" aria-label="Saved" />
                    ) : null}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] font-semibold text-muted tabular-nums">
                    <span>{SLOT_LABELS[recipe.slot]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {recipe.minutes} min
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{recipe.kcal} kcal</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-protein">P {recipe.protein} g</span>
                  </span>
                  {recipe.tags.some((tag) => TAG_LABELS[tag]) ? (
                    <span className="mt-2 flex flex-wrap gap-1">
                      {recipe.tags
                        .filter((tag) => TAG_LABELS[tag])
                        .map((tag) => (
                          <span key={tag} className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[0.6875rem] font-bold text-ink-soft">
                            {TAG_LABELS[tag]}
                          </span>
                        ))}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
