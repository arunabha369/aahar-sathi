import { INGREDIENT_CATEGORIES, type IngredientCategory, type PlanDay } from '../types.ts';

export interface GroceryGroup {
  category: IngredientCategory;
  items: string[];
}

export interface GroceryList {
  groups: GroceryGroup[];
  total: number;
}

/** Every ingredient the week needs, de-duplicated and grouped the way a shop is laid out. */
export function buildGroceryList(days: PlanDay[]): GroceryList {
  const byCategory = new Map<IngredientCategory, Set<string>>();

  for (const day of days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const existing = byCategory.get(ingredient.category) ?? new Set<string>();
        existing.add(ingredient.name);
        byCategory.set(ingredient.category, existing);
      }
    }
  }

  const groups = INGREDIENT_CATEGORIES.map((category) => ({
    category,
    items: [...(byCategory.get(category) ?? [])].sort((a, b) => a.localeCompare(b)),
  })).filter((group) => group.items.length > 0);

  return { groups, total: groups.reduce((count, group) => count + group.items.length, 0) };
}
