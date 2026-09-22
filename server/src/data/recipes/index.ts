import { INGREDIENT_FACTS, type IngredientFacts } from '../ingredientFacts.ts';
import type { IngredientKey } from '../meals.ts';
import { BREAKFAST_RECIPES } from './breakfast.ts';
import { DINNER_RECIPES } from './dinner.ts';
import { FASTING_RECIPES } from './fasting.ts';
import { LUNCH_RECIPES } from './lunch.ts';
import { SNACK_RECIPES } from './snacks.ts';
import type { Recipe, RecipeIngredient } from './types.ts';

export type { PrepTask, Recipe, RecipeIngredient, RecipeUnit } from './types.ts';

export const ALL_RECIPES: readonly Recipe[] = [
  ...BREAKFAST_RECIPES,
  ...LUNCH_RECIPES,
  ...DINNER_RECIPES,
  ...SNACK_RECIPES,
  ...FASTING_RECIPES,
];

const BY_SLUG = new Map(ALL_RECIPES.map((recipe) => [recipe.slug, recipe]));

export function recipeFor(slug: string): Recipe | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Jain cooking leaves these out and makes up the flavour another way; a dish that needs
 * them is still Jain-friendly. Every other Jain-avoided ingredient (potato, carrot, sweet
 * potato, honey) is part of the dish unless the recipe marks it optional.
 */
export const JAIN_SWAPS: Partial<Record<IngredientKey, string>> = {
  onion: 'Leave out the onion; a pinch more hing gives the base its savoury depth.',
  garlic: 'Leave out the garlic; add a pinch of hing with the tempering instead.',
  ginger: 'Use dry ginger powder (sonth) instead of fresh — about ¼ tsp for each tsp of fresh ginger.',
};

const factsOf = (key: IngredientKey): IngredientFacts => INGREDIENT_FACTS[key];
const jainAvoided = (key: IngredientKey) => factsOf(key).jainAvoid === true;
const vratAllowed = (key: IngredientKey) => factsOf(key).vrat === true || key === 'salt';

/** Every essential ingredient is either Jain-friendly or has a swap. */
export function isJainFriendly(recipe: Recipe): boolean {
  return recipe.ingredients.every(
    (ingredient) => ingredient.optional || !jainAvoided(ingredient.key) || ingredient.key in JAIN_SWAPS,
  );
}

/** Every essential ingredient is allowed on a vrat (ordinary salt is swapped for sendha namak). */
export function isVratFriendly(recipe: Recipe): boolean {
  return recipe.ingredients.every((ingredient) => ingredient.optional || vratAllowed(ingredient.key));
}

/**
 * The ingredients a recipe is cooked with in a given mode: Jain drops what it avoids
 * (swapped or optional), and a vrat swaps ordinary salt for sendha namak.
 */
export function ingredientsFor(recipe: Recipe, mode: { jain?: boolean; vrat?: boolean } = {}): RecipeIngredient[] {
  return recipe.ingredients.flatMap((ingredient) => {
    if (mode.jain && jainAvoided(ingredient.key)) return [];
    if (mode.vrat && ingredient.key === 'salt') return [{ ...ingredient, key: 'rockSalt' as const }];
    return [ingredient];
  });
}
