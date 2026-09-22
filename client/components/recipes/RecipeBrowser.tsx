'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Clock, Heart, Search, X } from 'lucide-react';
import { MealPhoto } from '@/components/plan/MealPhoto';
import { DietMark } from '@/components/recipes/DietMark';
import { ICON_SLOT, SLOT_LABELS, TAG_LABELS } from '@/components/recipes/recipeMeta';
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

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[0.8125rem] font-semibold transition-colors',
        pressed ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-soft ring-1 ring-line hover:bg-surface-3 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function RecipeBrowser({ recipes, favourites }: { recipes: RecipeSummary[]; favourites: string[] }) {
  const saved = useMemo(() => new Set(favourites), [favourites]);
  const [query, setQuery] = useState('');
  const [slot, setSlot] = useState<SlotFilter>('all');
  const [diets, setDiets] = useState<Diet[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const deferredQuery = useDeferredValue(query);

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

  const filtered = query.trim() !== '' || slot !== 'all' || diets.length > 0 || extras.length > 0;

  return (
    <div>
      <div className="surface mb-5 space-y-3 p-4">
        <label className="relative block cursor-text">
          <span className="sr-only">Search recipes</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search dishes, e.g. dal, paneer, dosa"
            className={cn(inputShell, 'border-line pl-10 hover:border-line-strong focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15')}
          />
        </label>
        <div role="group" aria-label="Meal" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SLOT_FILTERS.map((option) => (
            <Chip key={option.value} pressed={slot === option.value} onClick={() => setSlot(option.value)}>
              {option.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <div role="group" aria-label="Diet" className="flex flex-wrap gap-1.5">
            {DIET_FILTERS.map((option) => (
              <Chip key={option.value} pressed={diets.includes(option.value)} onClick={() => setDiets(toggle(diets, option.value))}>
                <DietMark diet={option.value} className="size-3.5" />
                {option.label}
              </Chip>
            ))}
          </div>
          <div role="group" aria-label="More filters" className="flex flex-wrap gap-1.5">
            {EXTRA_FILTERS.map((option) => (
              <Chip key={option.value} pressed={extras.includes(option.value)} onClick={() => setExtras(toggle(extras, option.value))}>
                {option.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted" aria-live="polite">
          {shown.length} {shown.length === 1 ? 'recipe' : 'recipes'}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSlot('all');
              setDiets([]);
              setExtras([]);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[0.8125rem] font-semibold text-ink-soft hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <p className="surface p-8 text-center text-sm text-muted">No recipe matches all of those. Try removing a filter.</p>
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
