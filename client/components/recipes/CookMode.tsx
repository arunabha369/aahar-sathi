'use client';

import { useEffect, useRef, useState } from 'react';
import { ChefHat, ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { scaledAmount } from '@/lib/recipeFormat';
import type { Recipe, RecipeIngredient } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CookModeProps {
  recipe: Recipe;
  /** What the ingredient amounts are scaled to on the recipe page. */
  servings: number;
  /** Ingredients as the page shows them: Jain swaps applied, amounts scaled. */
  ingredients: { ingredient: RecipeIngredient; leftOut: boolean; name: string }[];
  open: boolean;
  onClose: () => void;
}

/**
 * Cooking at the stove: one step at a time in large type, with the screen kept awake so it
 * doesn't lock with wet hands. The ingredients sit on the first card, so nothing is missed.
 */
export function CookMode({ recipe, servings, ingredients, open, onClose }: CookModeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(-1);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setStep(-1);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Keep the screen on while cooking, and take it back if the phone was locked meanwhile.
  useEffect(() => {
    if (!open || !('wakeLock' in navigator)) return;
    let cancelled = false;
    const hold = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        wakeLock.current = lock;
      } catch {
        // Denied or unsupported: cooking still works, the screen just dims as usual.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void hold();
    };
    void hold();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void wakeLock.current?.release().catch(() => undefined);
      wakeLock.current = null;
    };
  }, [open]);

  const last = recipe.steps.length - 1;
  const go = (next: number) => setStep(Math.max(-1, Math.min(last, next)));

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Cooking ${recipe.name}`}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') go(step + 1);
        if (event.key === 'ArrowLeft') go(step - 1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-canvas p-0 text-ink backdrop:bg-canvas open:flex open:flex-col"
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="eyebrow">Cooking · {servings === 1 ? '1 serving' : `${servings} servings`}</p>
          <h2 className="truncate text-base font-bold text-ink sm:text-lg">{recipe.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Leave cooking mode"
          className="grid size-11 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-2xl" aria-live="polite">
          {step < 0 ? (
            <div>
              <p className="eyebrow mb-3">Everything you need</p>
              <ul className="divide-y divide-line">
                {ingredients.map(({ ingredient, leftOut, name }) => (
                  <li key={ingredient.key} className={cn('flex items-baseline gap-4 py-3', leftOut && 'text-muted')}>
                    <span className={cn('w-28 shrink-0 text-right text-lg font-bold tabular-nums', leftOut ? 'line-through' : 'text-brand-800')}>
                      {scaledAmount(ingredient, servings)}
                    </span>
                    <span className="min-w-0 flex-1 text-lg">
                      <span className={cn(leftOut ? 'line-through' : 'font-semibold text-ink')}>{name}</span>
                      {ingredient.note ? <span className="text-muted">, {ingredient.note}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p className="eyebrow mb-3">
                Step {step + 1} of {recipe.steps.length}
              </p>
              <p className="text-[1.375rem] font-semibold leading-relaxed text-ink sm:text-2xl sm:leading-relaxed">
                {recipe.steps[step]}
              </p>
              {step === last && recipe.tip ? (
                <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-surface-2 p-4 text-[0.9375rem] leading-relaxed text-ink-soft ring-1 ring-line">
                  <Lightbulb className="mt-0.5 size-5 shrink-0 text-saffron-600" aria-hidden="true" />
                  {recipe.tip}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-line px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <Button variant="secondary" size="lg" onClick={() => go(step - 1)} disabled={step < 0} className="shrink-0">
            <ChevronLeft className="size-5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Back</span>
          </Button>
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {recipe.steps.map((text, index) => (
              <span
                key={text}
                className={cn('h-1.5 flex-1 rounded-full transition-colors', index <= step ? 'bg-accent' : 'bg-surface-3')}
              />
            ))}
          </div>
          {step < last ? (
            <Button size="lg" onClick={() => go(step + 1)} className="shrink-0">
              {step < 0 ? 'Start cooking' : 'Next step'}
              <ChevronRight className="size-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button size="lg" onClick={onClose} className="shrink-0">
              <ChefHat className="size-5" aria-hidden="true" />
              Done
            </Button>
          )}
        </div>
      </footer>
    </dialog>
  );
}
