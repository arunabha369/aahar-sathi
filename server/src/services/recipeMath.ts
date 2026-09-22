import { INGREDIENT_FACTS, type IngredientFacts } from '../data/ingredientFacts.ts';
import type { IngredientKey } from '../data/meals.ts';
import type { RecipeIngredient } from '../data/recipes/types.ts';

const facts = (key: IngredientKey): IngredientFacts => INGREDIENT_FACTS[key];

/** Grams (or ml) in a recipe amount. Salt and "to taste" amounts weigh nothing here. */
export function gramsOf({ key, qty, unit }: Pick<RecipeIngredient, 'key' | 'qty' | 'unit'>): number {
  const info = facts(key);
  switch (unit) {
    case 'g':
    case 'ml':
      return qty;
    case 'pc':
      return qty * (info.pieceGrams ?? 0);
    case 'tsp':
      return qty * (info.tspGrams ?? 3);
    case 'tbsp':
      return qty * 3 * (info.tspGrams ?? 3);
    case 'pinch':
      return qty * 0.3;
    case 'taste':
      return 0;
  }
}

/** Energy in a recipe amount, from the ingredient's kcal per 100 g. */
export function kcalOf(ingredient: Pick<RecipeIngredient, 'key' | 'qty' | 'unit'>): number {
  return (gramsOf(ingredient) * facts(ingredient.key).kcal100) / 100;
}

export function recipeKcal(ingredients: RecipeIngredient[]): number {
  return Math.round(ingredients.reduce((sum, ingredient) => sum + kcalOf(ingredient), 0));
}
