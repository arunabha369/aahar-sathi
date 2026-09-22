import { INGREDIENT_FACTS, type IngredientFacts } from '../data/ingredientFacts.ts';
import { ingredientInfo, type IngredientKey } from '../data/meals.ts';
import { ingredientsFor, recipeFor } from '../data/recipes/index.ts';
import { gramsOf } from './recipeMath.ts';
import { INGREDIENT_CATEGORIES, type IngredientCategory, type PlanDay, type PlanInputs, type PlanMeal } from '../types.ts';

export interface GroceryItem {
  name: string;
  /** What to buy, e.g. "1.2 kg" or "6 onions"; null for things bought by eye (salt). */
  amount: string | null;
  /** A second way to read the amount, e.g. "about 650 g". */
  detail: string | null;
}

export interface GroceryGroup {
  category: IngredientCategory;
  items: GroceryItem[];
}

export interface GroceryList {
  groups: GroceryGroup[];
  total: number;
}

const PLURALS: Record<string, string> = {
  apple: 'apples',
  banana: 'bananas',
  chilli: 'chillies',
  clove: 'cloves',
  date: 'dates',
  egg: 'eggs',
  leaf: 'leaves',
  lemon: 'lemons',
  onion: 'onions',
  pav: 'pav',
  slice: 'slices',
  tomato: 'tomatoes',
};

/** Curry leaves are bought by the sprig, not the leaf. */
const LEAVES_PER_SPRIG = 15;

/** Rounds up to the next step, so the shopping list never comes up short. */
const roundUp = (value: number, step: number) => Math.ceil(value / step - 1e-9) * step;

/** A weight (or volume) rounded up the way it is bought: "45 g", "350 g", "1.2 kg". */
export function formatWeight(grams: number, liquid = false): string {
  const [small, large] = liquid ? ['ml', 'L'] : ['g', 'kg'];
  if (grams < 100) return `${Math.max(5, roundUp(grams, 5))} ${small}`;
  if (grams < 1000) return `${roundUp(grams, 50)} ${small}`;
  const big = roundUp(grams / 1000, 0.1);
  return `${big.toFixed(1).replace(/\.0$/, '')} ${large}`;
}

const counted = (count: number, singular: string) => `${count} ${count === 1 ? singular : (PLURALS[singular] ?? `${singular}s`)}`;

/** A total in grams, written the way it is bought. */
export function formatAmount(key: IngredientKey, grams: number): Pick<GroceryItem, 'amount' | 'detail'> {
  const facts: IngredientFacts = INGREDIENT_FACTS[key];
  if (facts.toTaste || grams <= 0) return { amount: null, detail: null };

  if (facts.countAs && facts.pieceGrams) {
    const pieces = Math.max(1, Math.ceil(grams / facts.pieceGrams - 0.05));
    if (key === 'curryLeaves') return { amount: counted(Math.ceil(pieces / LEAVES_PER_SPRIG), 'sprig'), detail: null };
    // Heavy things counted by the piece also get a weight, for buying loose.
    const detail = facts.pieceGrams >= 50 && key !== 'eggs' ? `about ${formatWeight(grams, false)}` : null;
    return { amount: counted(pieces, facts.countAs), detail };
  }
  return { amount: formatWeight(grams, facts.liquid === true), detail: null };
}

/** Every portion of a meal the household eats: the planned one plus each member's. */
function servingsOf(meal: PlanMeal): number {
  return meal.factor + (meal.portions ?? []).reduce((sum, portion) => sum + portion.factor, 0);
}

/**
 * The week's shopping, in amounts: each dish's recipe times every portion planned of it,
 * cooked the way the day needs (Jain, vrat). Dishes without a recipe fall back to their
 * ingredient names alone.
 */
export function buildGroceryList(days: PlanDay[], inputs?: Pick<PlanInputs, 'preferences'>): GroceryList {
  const jain = inputs?.preferences?.jain ?? false;
  const grams = new Map<IngredientKey, number>();
  const unmeasured = new Map<string, IngredientCategory>();

  for (const day of days) {
    for (const meal of day.meals) {
      const recipe = recipeFor(meal.slug);
      if (!recipe) {
        for (const ingredient of meal.ingredients) unmeasured.set(ingredient.name, ingredient.category);
        continue;
      }
      const servings = servingsOf(meal);
      for (const ingredient of ingredientsFor(recipe, { jain, vrat: day.kind === 'vrat' })) {
        grams.set(ingredient.key, (grams.get(ingredient.key) ?? 0) + gramsOf(ingredient) * servings);
      }
    }
  }

  const byCategory = new Map<IngredientCategory, Map<string, GroceryItem>>();
  const add = (category: IngredientCategory, item: GroceryItem) => {
    const items = byCategory.get(category) ?? new Map<string, GroceryItem>();
    items.set(item.name, item);
    byCategory.set(category, items);
  };
  for (const [key, total] of grams) {
    const { name, category } = ingredientInfo(key);
    add(category, { name, ...formatAmount(key, total) });
  }
  for (const [name, category] of unmeasured) {
    if (!byCategory.get(category)?.has(name)) add(category, { name, amount: null, detail: null });
  }

  const groups = INGREDIENT_CATEGORIES.map((category) => ({
    category,
    items: [...(byCategory.get(category)?.values() ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.items.length > 0);

  return { groups, total: groups.reduce((count, group) => count + group.items.length, 0) };
}

/** Every item name on the list, for checking ticks against it. */
export function groceryItemNames(list: GroceryList): Set<string> {
  return new Set(list.groups.flatMap((group) => group.items.map((item) => item.name)));
}
