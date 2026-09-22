import { describe, expect, it } from 'vitest';
import { MEALS } from '../src/data/meals.ts';
import { INGREDIENT_CATEGORIES, MEAL_SLOTS, type MealSlot } from '../src/types.ts';

const bySlot = (slot: MealSlot) => MEALS.filter((meal) => meal.slot === slot);

describe('meal database', () => {
  it('has unique slugs', () => {
    expect(new Set(MEALS.map((meal) => meal.slug)).size).toBe(MEALS.length);
  });

  it('keeps 4×protein + 4×carbs + 9×fat within 10% of kcal for every meal', () => {
    for (const meal of MEALS) {
      const fromMacros = 4 * meal.protein + 4 * meal.carbs + 9 * meal.fat;
      const drift = Math.abs(fromMacros - meal.kcal) / meal.kcal;
      expect(drift, `${meal.slug}: ${fromMacros} kcal from macros vs ${meal.kcal} kcal`).toBeLessThanOrEqual(0.1);
    }
  });

  it('offers at least 8 vegetarian options in every slot', () => {
    for (const slot of MEAL_SLOTS) {
      expect(bySlot(slot).filter((meal) => meal.diet === 'veg').length, slot).toBeGreaterThanOrEqual(8);
    }
  });

  it('offers at least 3 egg options in every slot', () => {
    for (const slot of MEAL_SLOTS) {
      expect(bySlot(slot).filter((meal) => meal.diet === 'egg').length, slot).toBeGreaterThanOrEqual(3);
    }
  });

  it('offers at least 3 chicken/fish/meat options for lunch, dinner and snacks', () => {
    for (const slot of ['lunch', 'dinner', 'snack'] as const) {
      expect(bySlot(slot).filter((meal) => meal.diet === 'nonveg').length, slot).toBeGreaterThanOrEqual(3);
    }
  });

  it('spreads every slot across at least four regions', () => {
    for (const slot of MEAL_SLOTS) {
      expect(new Set(bySlot(slot).map((meal) => meal.region)).size, slot).toBeGreaterThanOrEqual(4);
    }
  });

  it('gives each ingredient name exactly one category', () => {
    const categoryByName = new Map<string, string>();
    for (const meal of MEALS) {
      for (const ingredient of meal.ingredients) {
        const known = categoryByName.get(ingredient.name);
        if (known) {
          expect(ingredient.category, `${ingredient.name} in ${meal.slug}`).toBe(known);
        } else {
          categoryByName.set(ingredient.name, ingredient.category);
          expect(INGREDIENT_CATEGORIES).toContain(ingredient.category);
        }
      }
    }
  });

  it('describes every meal with household portions and a shopping list', () => {
    for (const meal of MEALS) {
      expect(meal.items.length, meal.slug).toBeGreaterThan(0);
      expect(meal.ingredients.length, meal.slug).toBeGreaterThanOrEqual(2);
      for (const item of meal.items) {
        expect(item.qty, `${meal.slug}: ${item.food}`).toBeGreaterThan(0);
        expect(item.unit.length, `${meal.slug}: ${item.food}`).toBeGreaterThan(0);
        expect(item.food.length, meal.slug).toBeGreaterThan(2);
      }
    }
  });

  it('keeps calories in a sensible band for each slot', () => {
    for (const meal of MEALS) {
      // Iftar is the meal that breaks the fast, so it is sized as more than a snack.
      const iftar = meal.tags?.includes('iftar') ?? false;
      const [min, max] = meal.slot === 'snack' ? [120, iftar ? 400 : 320] : [250, 700];
      expect(meal.kcal, meal.slug).toBeGreaterThanOrEqual(min);
      expect(meal.kcal, meal.slug).toBeLessThanOrEqual(max);
    }
  });

  it('favours protein: every non-snack meal carries at least 12 g', () => {
    for (const meal of MEALS.filter((candidate) => candidate.slot !== 'snack')) {
      expect(meal.protein, meal.slug).toBeGreaterThanOrEqual(12);
    }
  });

  it('matches the anchor values used to build the database', () => {
    const idli = MEALS.find((meal) => meal.slug === 'idli-sambar');
    const chickenTikka = MEALS.find((meal) => meal.slug === 'chicken-tikka-snack');
    // 3 idli (~180 kcal) + sambar (~120) + chutney (~55)
    expect(idli?.kcal).toBeGreaterThan(330);
    expect(idli?.kcal).toBeLessThan(380);
    // 100 g cooked chicken ≈ 165 kcal and 31 g protein
    expect(chickenTikka?.protein).toBeGreaterThanOrEqual(28);
    expect(chickenTikka?.kcal).toBeLessThan(230);
  });
});
