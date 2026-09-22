import type { IngredientKey } from '../meals.ts';

/** How an ingredient amount is written in a recipe. */
export type RecipeUnit = 'g' | 'ml' | 'pc' | 'tsp' | 'tbsp' | 'pinch' | 'taste';

export interface RecipeIngredient {
  key: IngredientKey;
  qty: number;
  unit: RecipeUnit;
  /** Shown beside the amount, e.g. "finely chopped". */
  note?: string;
  /** Can be left out without spoiling the dish (lets Jain cooks drop a root vegetable). */
  optional?: boolean;
}

/**
 * Jobs that can be done in one Sunday session and keep for a few days. The batch-cooking
 * plan groups the week's dishes by these.
 */
export type PrepTask =
  | 'soak-cook-legumes'
  | 'cook-dal'
  | 'roti-dough'
  | 'batter'
  | 'coconut-chutney'
  | 'green-chutney'
  | 'chop-vegetables'
  | 'ginger-garlic-paste'
  | 'boil-potatoes'
  | 'boil-eggs'
  | 'tamarind-pulp'
  | 'sprout-moong'
  | 'onion-tomato-masala'
  | 'roast-nuts'
  | 'marinate';

export interface Recipe {
  /** The meal it belongs to (meals.ts). */
  slug: string;
  prepMinutes: number;
  cookMinutes: number;
  /** Amounts for ONE serving, exactly as the meal plan portions it at 1×. */
  ingredients: RecipeIngredient[];
  steps: string[];
  prepAhead?: PrepTask[];
  tip?: string;
}
