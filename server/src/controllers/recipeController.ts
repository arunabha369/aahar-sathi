import type { Request, Response } from 'express';
import { MEALS, ingredientInfo } from '../data/meals.ts';
import { JAIN_SWAPS, recipeFor } from '../data/recipes/index.ts';
import { INGREDIENT_FACTS, type IngredientFacts } from '../data/ingredientFacts.ts';
import { PREP_TASKS } from '../services/batchCooking.ts';
import { gramsOf } from '../services/recipeMath.ts';
import { ApiError } from '../utils/ApiError.ts';
import { validParams } from '../middleware/validate.ts';
import type { RecipeParams } from '../validation/schemas.ts';

/** Every dish with a recipe, in the order the meal list keeps them (by slot). */
export function listRecipes(_req: Request, res: Response): void {
  const recipes = MEALS.flatMap((meal) => {
    const recipe = recipeFor(meal.slug);
    if (!recipe) return [];
    return [
      {
        slug: meal.slug,
        name: meal.name,
        slot: meal.slot,
        diet: meal.diet,
        region: meal.region,
        tags: meal.tags ?? [],
        kcal: meal.kcal,
        protein: meal.protein,
        minutes: recipe.prepMinutes + recipe.cookMinutes,
      },
    ];
  });
  res.set('Cache-Control', 'private, max-age=300');
  res.json({ recipes });
}

export function getRecipe(req: Request, res: Response): void {
  const { slug } = validParams<RecipeParams>(req);
  const meal = MEALS.find((candidate) => candidate.slug === slug);
  const recipe = recipeFor(slug);
  if (!meal || !recipe) throw ApiError.notFound('We could not find that recipe.');

  const ingredients = recipe.ingredients.map((ingredient) => {
    const facts: IngredientFacts = INGREDIENT_FACTS[ingredient.key];
    const info = ingredientInfo(ingredient.key);
    return {
      key: ingredient.key,
      name: info.name,
      category: info.category,
      qty: ingredient.qty,
      unit: ingredient.unit,
      note: ingredient.note ?? null,
      optional: ingredient.optional === true,
      grams: Math.round(gramsOf(ingredient) * 10) / 10,
      /** For amounts in pieces: "clove", "leaf", "egg". */
      countAs: facts.countAs ?? null,
      jainAvoid: facts.jainAvoid === true,
    };
  });
  const jainNotes = [...new Set(recipe.ingredients.map((ingredient) => JAIN_SWAPS[ingredient.key]).filter(Boolean))];

  res.set('Cache-Control', 'private, max-age=300');
  res.json({
    recipe: {
      slug: meal.slug,
      name: meal.name,
      slot: meal.slot,
      diet: meal.diet,
      region: meal.region,
      tags: meal.tags ?? [],
      items: meal.items,
      kcal: meal.kcal,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      ingredients,
      steps: recipe.steps,
      tip: recipe.tip ?? null,
      prepAhead: (recipe.prepAhead ?? []).map((task) => ({
        task,
        title: PREP_TASKS[task].title,
        storage: PREP_TASKS[task].storage,
      })),
      jainNotes,
    },
  });
}
