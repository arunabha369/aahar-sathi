import { describe, expect, it } from 'vitest';
import { MEALS } from '../src/data/meals.ts';
import { buildGroceryList } from '../src/services/grocery.ts';
import { calculateTargets } from '../src/services/nutrition.ts';
import {
  dietAllows,
  generatePlanDays,
  isCountable,
  portionFactors,
  scaleFactor,
  scaleQuantity,
  slotTargetKcal,
  swapMealInDays,
  type PlannerMeal,
} from '../src/services/planGenerator.ts';
import { createRandom } from '../src/utils/random.ts';
import {
  ACTIVITIES,
  CUISINES,
  DIETS,
  GOALS,
  PLAN_SLOTS,
  SLOT_META,
  WEEKDAYS,
  type Profile,
} from '../src/types.ts';

const plannerMeals: PlannerMeal[] = MEALS.map((meal, index) => ({ ...meal, id: `meal-${index}` }));

const baseProfile: Profile = {
  age: 28,
  gender: 'male',
  weightKg: 72,
  heightCm: 174,
  activity: 'moderate',
  goal: 'maintain',
  diet: 'veg',
  cuisine: 'north',
};

function plan(profile: Profile, seed = 42) {
  const targets = calculateTargets(profile);
  return { targets, days: generatePlanDays({ profile, targets, meals: plannerMeals, random: createRandom(seed) }) };
}

/** A spread of profiles wide enough to stress every rule. */
function randomProfiles(count: number, seed = 11): Profile[] {
  const random = createRandom(seed);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T;
  return Array.from({ length: count }, () => ({
    age: 18 + Math.floor(random() * 62),
    gender: random() < 0.5 ? 'male' : 'female',
    weightKg: 40 + Math.round(random() * 90),
    heightCm: 140 + Math.round(random() * 50),
    activity: pick(ACTIVITIES),
    goal: pick(GOALS),
    diet: pick(DIETS),
    cuisine: pick(CUISINES),
  }));
}

describe('plan structure', () => {
  it('builds seven days of five meals with the right slots and times', () => {
    const { days } = plan(baseProfile);

    expect(days.map((day) => day.day)).toEqual([...WEEKDAYS]);
    for (const day of days) {
      expect(day.meals.map((meal) => meal.slot)).toEqual([...PLAN_SLOTS]);
      for (const meal of day.meals) {
        expect(meal.time).toBe(SLOT_META[meal.slot].time);
        expect(meal.mealId).toMatch(/^meal-\d+$/);
        expect(meal.items.length).toBeGreaterThan(0);
      }
    }
  });

  it('records totals that match the meals in the day', () => {
    const { days } = plan(baseProfile);
    for (const day of days) {
      const summed = day.meals.reduce(
        (totals, meal) => ({
          kcal: totals.kcal + meal.kcal,
          protein: totals.protein + meal.protein,
          carbs: totals.carbs + meal.carbs,
          fat: totals.fat + meal.fat,
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      );
      expect(day.totals).toEqual(summed);
    }
  });

  it('is deterministic for a given random function', () => {
    const first = plan(baseProfile, 99).days;
    const second = plan(baseProfile, 99).days;
    const third = plan(baseProfile, 100).days;

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(JSON.stringify(first)).not.toBe(JSON.stringify(third));
  });
});

describe('portion scaling', () => {
  it('rounds the factor to quarter steps and clamps it', () => {
    expect(scaleFactor(500, 500)).toBe(1);
    expect(scaleFactor(600, 500)).toBe(1.25);
    expect(scaleFactor(5000, 400)).toBe(2.5);
    expect(scaleFactor(100, 600)).toBe(0.5);
  });

  it('keeps anything counted whole and other portions in quarters', () => {
    expect(scaleQuantity({ qty: 2, unit: 'egg', food: 'Eggs' }, 1.5)).toBe(3);
    expect(scaleQuantity({ qty: 2, unit: 'egg', food: 'Eggs' }, 0.5)).toBe(1);
    expect(scaleQuantity({ qty: 1, unit: 'bowl', food: 'Rice' }, 1.6)).toBe(1.5);
    expect(scaleQuantity({ qty: 3, unit: 'roti', food: 'Roti' }, 1.25)).toBe(4);
    expect(scaleQuantity({ qty: 3, unit: 'idli', food: 'Steamed idli' }, 4 / 3)).toBe(4);
    expect(scaleQuantity({ qty: 120, unit: 'g', food: 'Chicken' }, 1.25)).toBe(150);
  });

  it('only offers portion sizes that keep counted items whole', () => {
    const idli = portionFactors({ items: [{ qty: 3, unit: 'idli', food: 'Steamed idli' }, { qty: 1, unit: 'bowl', food: 'Sambar' }] });
    expect(idli.map((factor) => Math.round(factor * 3))).toEqual([2, 3, 4, 5, 6, 7]);

    const paratha = portionFactors({ items: [{ qty: 1, unit: 'paratha', food: 'Paneer paratha' }] });
    expect(paratha).toEqual([1, 2]);

    const measured = portionFactors({ items: [{ qty: 1, unit: 'bowl', food: 'Poha' }] });
    expect(measured[0]).toBe(0.5);
    expect(measured.at(-1)).toBe(2.5);
    expect(measured.every((factor) => Math.round(factor * 100) % 25 === 0)).toBe(true);
  });

  it('never prescribes a portion outside 0.5×–2.5×, and never a fraction of a counted item', () => {
    for (const profile of randomProfiles(60)) {
      const { days } = plan(profile, 7);
      for (const day of days) {
        for (const meal of day.meals) {
          expect(meal.factor).toBeGreaterThanOrEqual(0.5);
          expect(meal.factor).toBeLessThanOrEqual(2.5);
          for (const item of meal.items) {
            if (isCountable(item.unit)) {
              expect(Number.isInteger(item.qty), `${item.qty} ${item.unit} in ${meal.slug}`).toBe(true);
            }
          }
        }
      }
    }
  });
});

describe('calorie targets', () => {
  it('lands every day within ±10% of the target across many profiles', () => {
    for (const profile of randomProfiles(150, 5)) {
      const { targets, days } = plan(profile, profile.age * 31 + profile.weightKg);
      for (const day of days) {
        const drift = Math.abs(day.totals.kcal - targets.calories) / targets.calories;
        expect(drift, `${JSON.stringify(profile)} ${day.day}: ${day.totals.kcal} vs ${targets.calories}`).toBeLessThanOrEqual(0.1);
      }
    }
  });

  it('splits the day into the documented shares', () => {
    expect(slotTargetKcal(2000, 'breakfast')).toBe(500);
    expect(slotTargetKcal(2000, 'midMorning')).toBe(200);
    expect(slotTargetKcal(2000, 'lunch')).toBe(600);
    expect(slotTargetKcal(2000, 'eveningSnack')).toBe(200);
    expect(slotTargetKcal(2000, 'dinner')).toBe(500);
  });
});

describe('macro balance', () => {
  it('keeps fat within the dashboard’s “High” line and protein above “Low” on nearly every day', () => {
    let days = 0;
    let fatHigh = 0;
    let proteinLow = 0;
    for (const profile of randomProfiles(150, 21)) {
      const { targets, days: week } = plan(profile, 5);
      for (const day of week) {
        days += 1;
        if (day.totals.fat > targets.fat * 1.15) fatHigh += 1;
        if (day.totals.protein < targets.protein * 0.85) proteinLow += 1;
        expect(Math.abs(day.totals.kcal - targets.calories) / targets.calories).toBeLessThanOrEqual(0.05);
      }
    }
    // Before balancing macros, about two days in three ran over on fat and one in five
    // fell short on protein. What remains is mostly vegetarian and egg weight-loss plans,
    // limited by the recipes, plus days where keeping to the chosen cuisine won.
    expect(fatHigh / days).toBeLessThan(0.06);
    expect(proteinLow / days).toBeLessThan(0.15);
  });
});

describe('diet rules', () => {
  it('knows what each diet allows', () => {
    expect(dietAllows('veg', 'veg')).toBe(true);
    expect(dietAllows('veg', 'egg')).toBe(false);
    expect(dietAllows('veg', 'nonveg')).toBe(false);
    expect(dietAllows('egg', 'egg')).toBe(true);
    expect(dietAllows('egg', 'nonveg')).toBe(false);
    expect(dietAllows('nonveg', 'nonveg')).toBe(true);
  });

  it('keeps vegetarian plans vegetarian', () => {
    for (const profile of randomProfiles(40, 3).map((p) => ({ ...p, diet: 'veg' as const }))) {
      const { days } = plan(profile, 21);
      for (const day of days) {
        for (const meal of day.meals) expect(meal.diet).toBe('veg');
      }
    }
  });

  it('gives eggetarians at least one egg dish a day and never meat', () => {
    for (const profile of randomProfiles(40, 4).map((p) => ({ ...p, diet: 'egg' as const }))) {
      const { days } = plan(profile, 33);
      for (const day of days) {
        expect(day.meals.some((meal) => meal.diet === 'egg'), day.day).toBe(true);
        expect(day.meals.every((meal) => meal.diet !== 'nonveg')).toBe(true);
      }
    }
  });

  it('gives non-vegetarians meat at lunch or dinner every day', () => {
    for (const profile of randomProfiles(40, 6).map((p) => ({ ...p, diet: 'nonveg' as const }))) {
      const { days } = plan(profile, 55);
      for (const day of days) {
        const hasMeat = day.meals.some(
          (meal) => meal.diet === 'nonveg' && (meal.slot === 'lunch' || meal.slot === 'dinner'),
        );
        expect(hasMeat, `${day.day} of ${JSON.stringify(profile)}`).toBe(true);
      }
    }
  });
});

describe('variety rules', () => {
  it('never repeats a dish on consecutive days and keeps the two snacks different', () => {
    for (const profile of randomProfiles(60, 8)) {
      const { days } = plan(profile, 13);
      let previous = new Set<string>();
      for (const day of days) {
        const slugs = day.meals.map((meal) => meal.slug);
        expect(new Set(slugs).size, `${day.day} repeats a dish within the day`).toBe(slugs.length);
        for (const slug of slugs) {
          expect(previous.has(slug), `${slug} repeats on consecutive days`).toBe(false);
        }
        previous = new Set(slugs);
      }
    }
  });

  it('keeps a dish to at most twice a week in the same slot for a well-stocked diet', () => {
    for (const profile of randomProfiles(40, 9).map((p) => ({ ...p, diet: 'nonveg' as const, cuisine: 'mix' as const }))) {
      const { days } = plan(profile, 17);
      const counts = new Map<string, number>();
      for (const day of days) {
        for (const meal of day.meals) {
          const key = `${meal.slot}|${meal.slug}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
          expect(counts.get(key), key).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('puts at least 15 different dishes in a week', () => {
    for (const profile of randomProfiles(30, 10)) {
      const { days } = plan(profile, 23);
      const distinct = new Set(days.flatMap((day) => day.meals.map((meal) => meal.slug)));
      expect(distinct.size).toBeGreaterThanOrEqual(15);
    }
  });

  it('favours the chosen cuisine over an unpreferred one', () => {
    const north = { ...baseProfile, cuisine: 'north' as const, diet: 'nonveg' as const };
    const mix = { ...north, cuisine: 'mix' as const };

    const share = (profile: Profile, seedBase: number) => {
      let matches = 0;
      let total = 0;
      for (let seed = 0; seed < 25; seed += 1) {
        const { days } = plan(profile, seedBase + seed);
        for (const day of days) {
          for (const meal of day.meals) {
            total += 1;
            if (meal.region === 'north') matches += 1;
          }
        }
      }
      return matches / total;
    };

    const preferred = share(north, 200);
    const neutral = share(mix, 200);
    expect(preferred).toBeGreaterThan(neutral + 0.15);
    expect(preferred).toBeGreaterThan(0.45);
  });
});

describe('swapping a meal', () => {
  it('replaces one dish and refreshes that day only', () => {
    const { targets, days } = plan(baseProfile, 77);
    const swapped = swapMealInDays({
      days,
      dayIndex: 2,
      slot: 'lunch',
      profile: baseProfile,
      targets,
      meals: plannerMeals,
      random: createRandom(5),
    });

    const before = days[2]!.meals.find((meal) => meal.slot === 'lunch')!;
    const after = swapped[2]!.meals.find((meal) => meal.slot === 'lunch')!;

    expect(after.slug).not.toBe(before.slug);
    expect(swapped[2]!.totals.kcal).toBe(
      swapped[2]!.meals.reduce((sum, meal) => sum + meal.kcal, 0),
    );
    expect(JSON.stringify(swapped[0])).toBe(JSON.stringify(days[0]));
    expect(JSON.stringify(swapped[6])).toBe(JSON.stringify(days[6]));
  });

  it('respects the diet when swapping', () => {
    const profile: Profile = { ...baseProfile, diet: 'egg' };
    const { targets, days } = plan(profile, 88);
    let current = days;
    for (let round = 0; round < 10; round += 1) {
      current = swapMealInDays({
        days: current,
        dayIndex: round % 7,
        slot: 'dinner',
        profile,
        targets,
        meals: plannerMeals,
        random: createRandom(round + 1),
      });
    }
    for (const day of current) {
      for (const meal of day.meals) expect(meal.diet).not.toBe('nonveg');
    }
  });
});

describe('grocery list', () => {
  it('de-duplicates ingredients and groups them by category', () => {
    const { days } = plan(baseProfile, 31);
    const list = buildGroceryList(days);

    const names = list.groups.flatMap((group) => group.items);
    expect(new Set(names).size).toBe(names.length);
    expect(list.total).toBe(names.length);
    expect(list.groups.length).toBeGreaterThan(4);
    for (const group of list.groups) {
      expect(group.items).toEqual([...group.items].sort((a, b) => a.localeCompare(b)));
    }
    expect(names).toContain('Salt');
  });
});
