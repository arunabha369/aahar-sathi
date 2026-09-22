'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChefHat, Clock, Heart, Info, Leaf, Minus, Plus, Refrigerator } from 'lucide-react';
import { MealPhoto } from '@/components/plan/MealPhoto';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { CookMode } from '@/components/recipes/CookMode';
import { ApiError, api } from '@/lib/api/client';
import { DietMark } from '@/components/recipes/DietMark';
import { Switch } from '@/components/ui/Switch';
import { ICON_SLOT, REGION_LABELS, SLOT_LABELS, TAG_LABELS } from '@/components/recipes/recipeMeta';
import { formatItem } from '@/lib/format';
import { quarter, scaledAmount, servingsLabel } from '@/lib/recipeFormat';
import type { Recipe } from '@/lib/types';
import { cn } from '@/lib/utils';

const MIN_SERVINGS = 0.5;
const MAX_SERVINGS = 12;

interface RecipeViewProps {
  recipe: Recipe;
  /** Whether this recipe is starred. */
  favourite: boolean;
  /** Servings to start at: 1, or the portion(s) in the user's plan. */
  initialServings: number;
  /** Why the recipe opened at that size ("your plan's portion"). */
  servingsNote: string | null;
  /** Start in the Jain version (the user cooks Jain). */
  jainByDefault: boolean;
}

export function RecipeView({ recipe, favourite, initialServings, servingsNote, jainByDefault }: RecipeViewProps) {
  const toast = useToast();
  const [starred, setStarred] = useState(favourite);
  const [cooking, setCooking] = useState(false);
  const [servings, setServings] = useState(initialServings);
  const jainFriendly = recipe.tags.includes('jain');
  const [jain, setJain] = useState(jainByDefault && jainFriendly);
  const vrat = recipe.tags.includes('vrat');

  // Half a serving at a time from the starting size, never below half a serving.
  const step = (direction: 1 | -1) =>
    setServings((current) => Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round((current + direction * 0.5) * 2) / 2)));

  const shownTags = recipe.tags.filter((tag) => TAG_LABELS[tag]);
  // One list for the page and for cooking mode, so they can never disagree.
  const ingredients = recipe.ingredients.map((ingredient) => ({
    ingredient,
    leftOut: jain && ingredient.jainAvoid,
    name: vrat && ingredient.key === 'salt' ? 'Sendha namak (rock salt)' : ingredient.name,
  }));

  const toggleStar = async () => {
    const next = !starred;
    setStarred(next);
    try {
      await api.put('/recipes/favourites', { slug: recipe.slug, favourite: next });
    } catch (error) {
      setStarred(!next);
      toast.error(error instanceof ApiError ? error.message : 'We could not save that.');
    }
  };
  const macros = [
    { label: 'kcal', value: Math.round(recipe.kcal * servings), className: 'text-ink' },
    { label: 'protein', value: `${Math.round(recipe.protein * servings)} g`, className: 'text-protein' },
    { label: 'carbs', value: `${Math.round(recipe.carbs * servings)} g`, className: 'text-carbs' },
    { label: 'fat', value: `${Math.round(recipe.fat * servings)} g`, className: 'text-fat' },
  ];

  return (
    <article className="animate-rise">
      <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start">
        <MealPhoto
          slug={recipe.slug}
          slot={ICON_SLOT[recipe.slot]}
          region={recipe.region}
          className="size-24 sm:size-28"
          sizes="112px"
          eager
        />
        <div className="min-w-0">
          <p className="eyebrow mb-1.5">
            {SLOT_LABELS[recipe.slot]} · {REGION_LABELS[recipe.region] ?? recipe.region}
          </p>
          <h1 className="flex items-start gap-2.5 text-[1.75rem] font-extrabold leading-tight text-ink sm:text-[2rem]">
            <DietMark diet={recipe.diet} className="mt-2.5 size-5" />
            <span>{recipe.name}</span>
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {recipe.prepMinutes} min prep · {recipe.cookMinutes} min cooking
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setCooking(true)}>
              <ChefHat className="size-4" aria-hidden="true" />
              Cook this
            </Button>
            <Button variant="secondary" onClick={toggleStar} aria-pressed={starred}>
              <Heart className={cn('size-4', starred ? 'fill-chilli-500 text-chilli-500' : 'text-muted')} aria-hidden="true" />
              {starred ? 'Saved' : 'Save'}
            </Button>
          </div>
          {shownTags.length > 0 ? (
            <p className="mt-2.5 flex flex-wrap gap-1.5">
              {shownTags.map((tag) => (
                <span key={tag} className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-bold text-ink-soft ring-1 ring-line">
                  {TAG_LABELS[tag]}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="surface p-5 sm:p-6" aria-labelledby="ingredients-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="ingredients-heading" className="text-base font-bold text-ink sm:text-lg">
              Ingredients
            </h2>
            <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-line" role="group" aria-label="Servings">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={servings <= MIN_SERVINGS}
                aria-label="Fewer servings"
                className="grid size-11 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-surface-3 hover:text-ink disabled:opacity-40"
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <output className="min-w-[6.5rem] text-center text-sm font-bold text-ink tabular-nums" aria-live="polite">
                {servingsLabel(servings)}
              </output>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={servings >= MAX_SERVINGS}
                aria-label="More servings"
                className="grid size-11 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-surface-3 hover:text-ink disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {servingsNote ? <p className="-mt-2 mb-3 text-[0.8125rem] text-muted">{servingsNote}</p> : null}

          {jainFriendly ? (
            <Switch
              checked={jain}
              onChange={setJain}
              label="Jain version"
              description="No onion, garlic or root vegetables"
              className="mb-4 rounded-xl bg-surface-2 px-3.5 ring-1 ring-line"
            />
          ) : null}

          <ul className="divide-y divide-line">
            {ingredients.map(({ ingredient, leftOut: left, name }) => {
              return (
                <li key={ingredient.key} className={cn('flex items-baseline gap-3 py-2.5', left && 'text-muted')}>
                  <span
                    className={cn(
                      'w-[5.5rem] shrink-0 text-right text-sm font-bold tabular-nums',
                      left ? 'text-muted line-through' : 'text-brand-800',
                    )}
                  >
                    {scaledAmount(ingredient, servings)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className={cn('font-semibold', left ? 'line-through' : 'text-ink')}>{name}</span>
                    {ingredient.note ? <span className="text-muted">, {ingredient.note}</span> : null}
                    {left ? <span className="ml-1.5 text-xs font-bold text-muted">left out</span> : null}
                    {!left && ingredient.optional ? <span className="ml-1.5 text-xs font-bold text-muted">optional</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>

          {jain && recipe.jainNotes.length > 0 ? (
            <div className="mt-4 rounded-xl bg-brand-50 p-3.5 ring-1 ring-inset ring-brand-100">
              <p className="mb-1.5 flex items-center gap-1.5 text-[0.8125rem] font-bold text-brand-800">
                <Leaf className="size-4" aria-hidden="true" />
                Cooking it Jain
              </p>
              <ul className="list-disc space-y-1 pl-5 text-[0.8125rem] leading-relaxed text-brand-800">
                {recipe.jainNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {vrat ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-saffron-50 p-3.5 text-[0.8125rem] leading-relaxed text-saffron-800 ring-1 ring-inset ring-saffron-200">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Fast-friendly. Cook with sendha namak rather than ordinary salt, and check your family’s own vrat rules — some
              leave out tomato or chilli too.
            </p>
          ) : null}

          <dl className="mt-5 grid grid-cols-4 gap-2 rounded-xl bg-surface-2 p-3 text-center ring-1 ring-line">
            {macros.map((macro) => (
              <div key={macro.label}>
                <dt className="text-[0.6875rem] font-semibold text-muted">{macro.label}</dt>
                <dd className={cn('text-sm font-extrabold tabular-nums', macro.className)}>{macro.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted">
            One serving is {recipe.items.map((item) => formatItem(item)).join(' + ')}.
          </p>
        </section>

        <div className="min-w-0 space-y-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="method-heading">
            <h2 id="method-heading" className="mb-4 flex items-center gap-2 text-base font-bold text-ink sm:text-lg">
              <ChefHat className="size-5 text-brand-700" aria-hidden="true" />
              Method
            </h2>
            <ol className="space-y-4">
              {recipe.steps.map((stepText, index) => (
                <li key={index} className="flex gap-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-accent-ink tabular-nums">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-[0.9375rem] leading-relaxed text-ink-soft">{stepText}</p>
                </li>
              ))}
            </ol>
            {recipe.tip ? (
              <p className="mt-5 rounded-xl bg-surface-2 p-3.5 text-[0.8125rem] leading-relaxed text-ink-soft ring-1 ring-line">
                <span className="font-bold text-ink">Tip: </span>
                {recipe.tip}
              </p>
            ) : null}
          </section>

          {recipe.prepAhead.length > 0 ? (
            <section className="surface p-5 sm:p-6" aria-labelledby="ahead-heading">
              <h2 id="ahead-heading" className="mb-1 flex items-center gap-2 text-base font-bold text-ink">
                <Refrigerator className="size-5 text-brand-700" aria-hidden="true" />
                Can be prepped ahead
              </h2>
              <p className="mb-3 text-[0.8125rem] text-muted">
                These go into your{' '}
                <Link href="/grocery/prep" className="font-semibold text-brand-800 underline underline-offset-2 hover:text-ink">
                  Sunday prep
                </Link>{' '}
                when this dish is in your plan.
              </p>
              <ul className="space-y-2">
                {recipe.prepAhead.map((task) => (
                  <li key={task.task} className="rounded-xl bg-surface-2 px-3.5 py-2.5 ring-1 ring-line">
                    <p className="text-sm font-semibold text-ink">{task.title}</p>
                    <p className="text-xs text-muted">{task.storage}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
      <p className="sr-only">Scaled to {quarter(servings)} servings.</p>

      <CookMode
        recipe={recipe}
        servings={servings}
        ingredients={ingredients}
        open={cooking}
        onClose={() => setCooking(false)}
      />
    </article>
  );
}
