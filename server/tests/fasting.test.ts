import { describe, expect, it } from 'vitest';
import { cityFor } from '../src/data/cities.ts';
import { INGREDIENT_FACTS, type IngredientFacts } from '../src/data/ingredientFacts.ts';
import { MEALS } from '../src/data/meals.ts';
import { ALL_RECIPES, JAIN_SWAPS, ingredientsFor, recipeFor } from '../src/data/recipes/index.ts';
import { ekadashiDays, lunarElongation, ramadanTimes, sunAltitudeTime, istClock } from '../src/services/almanac.ts';
import { buildBatchPlan, PREP_TASKS } from '../src/services/batchCooking.ts';
import { buildGroceryList, formatAmount } from '../src/services/grocery.ts';
import { withHouseholdPortions, strictestDiet } from '../src/services/household.ts';
import { calculateTargets } from '../src/services/nutrition.ts';
import {
  RAMADAN_LATE_SNACK_FROM_KCAL,
  dayKindFor,
  fitsDay,
  generatePlanDays,
  ramadanMealTimes,
  swapMealInDays,
  type PlannerMeal,
} from '../src/services/planGenerator.ts';
import { recipeKcal } from '../src/services/recipeMath.ts';
import { createRandom } from '../src/utils/random.ts';
import { DEFAULT_PREFERENCES, WEEKDAYS, type PlanPreferences, type Profile } from '../src/types.ts';

const plannerMeals: PlannerMeal[] = MEALS.map((meal, index) => ({ ...meal, id: `meal-${index}` }));
const bySlug = new Map(plannerMeals.map((meal) => [meal.slug, meal]));
const facts = (key: string): IngredientFacts => INGREDIENT_FACTS[key as keyof typeof INGREDIENT_FACTS];

const profile: Profile = {
  age: 34,
  gender: 'female',
  weightKg: 64,
  heightCm: 160,
  activity: 'light',
  goal: 'loss',
  diet: 'nonveg',
  cuisine: 'north',
};

const plan = (preferences: Partial<PlanPreferences>, overrides: Partial<Profile> = {}, seed = 7) => {
  const who = { ...profile, ...overrides };
  const targets = calculateTargets(who);
  return {
    targets,
    days: generatePlanDays({
      profile: who,
      targets,
      meals: plannerMeals,
      preferences: { ...DEFAULT_PREFERENCES, ...preferences },
      random: createRandom(seed),
    }),
  };
};

describe('recipes', () => {
  it('has a recipe for every dish, and nothing else', () => {
    for (const meal of MEALS) expect(recipeFor(meal.slug), meal.slug).toBeDefined();
    const slugs = new Set(MEALS.map((meal) => meal.slug));
    for (const recipe of ALL_RECIPES) expect(slugs.has(recipe.slug), recipe.slug).toBe(true);
    expect(new Set(ALL_RECIPES.map((recipe) => recipe.slug)).size).toBe(ALL_RECIPES.length);
    expect(MEALS.length).toBeGreaterThanOrEqual(100);
  });

  it('adds up to the dish it belongs to, within 15% of its calories', () => {
    for (const meal of MEALS) {
      const kcal = recipeKcal(recipeFor(meal.slug)!.ingredients);
      expect(Math.abs(kcal - meal.kcal) / meal.kcal, `${meal.slug}: recipe ${kcal} vs dish ${meal.kcal}`).toBeLessThanOrEqual(0.15);
    }
  });

  it('is complete enough to cook from', () => {
    for (const recipe of ALL_RECIPES) {
      expect(recipe.steps.length, recipe.slug).toBeGreaterThanOrEqual(1);
      expect(recipe.ingredients.length, recipe.slug).toBeGreaterThanOrEqual(2);
      expect(recipe.prepMinutes + recipe.cookMinutes, recipe.slug).toBeGreaterThan(0);
      for (const ingredient of recipe.ingredients) {
        expect(facts(ingredient.key), `${recipe.slug}: ${ingredient.key}`).toBeDefined();
        if (ingredient.unit !== 'taste') expect(ingredient.qty, `${recipe.slug}: ${ingredient.key}`).toBeGreaterThan(0);
      }
      for (const task of recipe.prepAhead ?? []) expect(PREP_TASKS[task], `${recipe.slug}: ${task}`).toBeDefined();
    }
  });

  it('tags vrat dishes only when every essential ingredient is allowed on a fast', () => {
    const vrat = MEALS.filter((meal) => meal.tags?.includes('vrat'));
    expect(vrat.length).toBeGreaterThanOrEqual(20);
    for (const meal of vrat) {
      expect(meal.diet, meal.slug).toBe('veg');
      for (const ingredient of recipeFor(meal.slug)!.ingredients) {
        if (ingredient.optional || ingredient.key === 'salt') continue;
        expect(facts(ingredient.key).vrat, `${meal.slug}: ${ingredient.key}`).toBe(true);
      }
    }
    // Grains and pulses are never vrat food.
    for (const slug of ['rajma-chawal', 'idli-sambar', 'dal-lauki-roti']) {
      expect(bySlug.get(slug)!.tags ?? []).not.toContain('vrat');
    }
  });

  it('tags Jain dishes only when what remains after the Jain swaps has no root vegetables', () => {
    const jain = MEALS.filter((meal) => meal.tags?.includes('jain'));
    expect(jain.length).toBeGreaterThanOrEqual(40);
    for (const meal of jain) {
      expect(meal.diet, meal.slug).toBe('veg');
      for (const ingredient of ingredientsFor(recipeFor(meal.slug)!, { jain: true })) {
        expect(facts(ingredient.key).jainAvoid ?? false, `${meal.slug}: ${ingredient.key}`).toBe(false);
      }
      for (const ingredient of recipeFor(meal.slug)!.ingredients) {
        if (facts(ingredient.key).jainAvoid && !ingredient.optional) expect(JAIN_SWAPS[ingredient.key]).toBeDefined();
      }
    }
    expect(bySlug.get('dal-rice-mixed-veg')!.tags ?? []).not.toContain('jain'); // potato is the sabzi
  });

  it('keeps fast-day staples and iftar platters off ordinary days', () => {
    for (const meal of MEALS.filter((candidate) => candidate.tags?.includes('fastOnly'))) {
      expect(meal.tags, meal.slug).toContain('vrat');
      expect(fitsDay(meal, meal.slot === 'snack' ? 'eveningSnack' : meal.slot, 'normal', false), meal.slug).toBe(false);
    }
    for (const meal of MEALS.filter((candidate) => candidate.tags?.includes('iftar'))) {
      expect(fitsDay(meal, 'eveningSnack', 'normal', false), meal.slug).toBe(false);
      expect(fitsDay(meal, 'eveningSnack', 'ramadan', false), meal.slug).toBe(true);
    }
  });
});

describe('fasting and Jain plans', () => {
  it('makes every Navratri day a vegetarian vrat, whatever the profile diet', () => {
    const { days } = plan({ fasting: 'navratri' });
    for (const day of days) {
      expect(day.kind).toBe('vrat');
      expect(day.meals).toHaveLength(5);
      for (const meal of day.meals) {
        expect(bySlug.get(meal.slug)!.tags, meal.slug).toContain('vrat');
        expect(meal.diet).toBe('veg');
      }
    }
  });

  it('fasts only on the chosen days in Ekadashi mode', () => {
    const { days } = plan({ fasting: 'ekadashi', vratDays: ['Tue', 'Fri'] });
    for (const day of days) {
      const fast = day.day === 'Tue' || day.day === 'Fri';
      expect(day.kind ?? 'normal', day.day).toBe(fast ? 'vrat' : 'normal');
      for (const meal of day.meals) {
        const tags = bySlug.get(meal.slug)!.tags ?? [];
        if (fast) expect(tags, meal.slug).toContain('vrat');
        else expect(tags, meal.slug).not.toContain('fastOnly');
      }
    }
    expect(dayKindFor('Wed', { ...DEFAULT_PREFERENCES, fasting: 'ekadashi', vratDays: ['Tue'] })).toBe('normal');
    // A weekly vrat (a Monday fast, say) works without any fasting mode.
    expect(dayKindFor('Mon', { ...DEFAULT_PREFERENCES, vratDays: ['Mon'] })).toBe('vrat');
  });

  it('builds Ramadan days as sehri, iftar and dinner, in eating order, at the calculated times', () => {
    const { days, targets } = plan({ fasting: 'ramadan', city: 'delhi' }, { diet: 'egg' });
    expect(targets.calories).toBeLessThan(RAMADAN_LATE_SNACK_FROM_KCAL);
    const withTimes = generatePlanDays({
      profile: { ...profile, diet: 'egg' },
      targets,
      meals: plannerMeals,
      preferences: { ...DEFAULT_PREFERENCES, fasting: 'ramadan', city: 'delhi' },
      fastTimes: { Mon: { date: '2026-02-23', sehriEnds: '05:34', iftar: '18:19' } },
      random: createRandom(3),
    });
    for (const day of days) {
      expect(day.kind).toBe('ramadan');
      expect(day.meals.map((meal) => meal.slot)).toEqual(['breakfast', 'eveningSnack', 'dinner']);
      expect(day.meals.map((meal) => meal.label)).toEqual(['Sehri', 'Iftar', 'Dinner']);
      expect(bySlug.get(day.meals[0]!.slug)!.tags).toContain('sehri');
      expect(bySlug.get(day.meals[1]!.slug)!.tags).toContain('iftar');
      expect(Math.abs(day.totals.kcal - targets.calories) / targets.calories).toBeLessThanOrEqual(0.06);
    }
    const monday = withTimes.find((day) => day.day === 'Mon')!;
    expect(monday.fastTimes).toEqual({ date: '2026-02-23', sehriEnds: '05:34', iftar: '18:19' });
    // Sehri 40 minutes before it ends (to the nearest 5), iftar at sunset, dinner two hours later.
    expect(monday.meals.map((meal) => meal.time)).toEqual(['4:50 AM', '6:20 PM', '8:20 PM']);
    // Rounding never puts iftar before sunset or sehri after it should end.
    const times = ramadanMealTimes({ date: '2026-02-23', sehriEnds: '05:31', iftar: '18:16' })!;
    expect(times.breakfast).toBe('4:50 AM');
    expect(times.eveningSnack).toBe('6:20 PM');
  });

  it('adds a fourth Ramadan meal when three could not carry the target', () => {
    const cases = [
      { who: { weightKg: 80, heightCm: 180, activity: 'moderate' as const, goal: 'gain' as const }, fourth: 'Late snack' },
      { who: { weightKg: 95, heightCm: 185, activity: 'active' as const, goal: 'gain' as const }, fourth: 'Late meal' },
    ];
    for (const { who, fourth } of cases) {
      const big = { ...profile, ...who, age: 30, gender: 'male' as const };
      const targets = calculateTargets(big);
      expect(targets.calories).toBeGreaterThanOrEqual(RAMADAN_LATE_SNACK_FROM_KCAL);
      const days = generatePlanDays({
        profile: big,
        targets,
        meals: plannerMeals,
        preferences: { ...DEFAULT_PREFERENCES, fasting: 'ramadan' },
        random: createRandom(11),
      });
      for (const day of days) {
        expect(day.meals.map((meal) => meal.label)).toEqual(['Sehri', 'Iftar', 'Dinner', fourth]);
        expect(Math.abs(day.totals.kcal - targets.calories) / targets.calories, `${targets.calories} kcal`).toBeLessThanOrEqual(0.08);
      }
    }
  });

  it('plans only Jain-friendly vegetarian dishes in Jain mode', () => {
    for (let seed = 1; seed <= 5; seed += 1) {
      const { days } = plan({ jain: true }, {}, seed);
      for (const meal of days.flatMap((day) => day.meals)) {
        expect(bySlug.get(meal.slug)!.tags, meal.slug).toContain('jain');
        expect(meal.diet).toBe('veg');
      }
    }
  });

  it('keeps a swapped dish within the day’s rules and its Ramadan time', () => {
    const { days, targets } = plan({ fasting: 'ramadan' }, { diet: 'veg' });
    const preferences = { ...DEFAULT_PREFERENCES, fasting: 'ramadan' as const };
    const swapped = swapMealInDays({
      days,
      dayIndex: 2,
      slot: 'eveningSnack',
      profile: { ...profile, diet: 'veg' },
      targets,
      meals: plannerMeals,
      preferences,
      random: createRandom(5),
    });
    const before = days[2]!.meals.find((meal) => meal.slot === 'eveningSnack')!;
    const after = swapped[2]!.meals.find((meal) => meal.slot === 'eveningSnack')!;
    expect(after.slug).not.toBe(before.slug);
    expect(bySlug.get(after.slug)!.tags).toContain('iftar');
    expect(after.label).toBe('Iftar');
    expect(after.time).toBe(before.time);
  });
});

describe('Ramadan times on a later date', () => {
  it('recalculates sehri and iftar for the real date, not the week the plan was made', async () => {
    const { onDate } = await import('../src/services/fastTimes.ts');
    const { days } = plan({ fasting: 'ramadan', city: 'delhi' }, { diet: 'veg' });
    const day = { ...days[0]!, fastTimes: { date: '2026-02-19', sehriEnds: '05:37', iftar: '18:15' } };
    const later = onDate(day, '2026-03-12', { preferences: { ...DEFAULT_PREFERENCES, fasting: 'ramadan', city: 'delhi' } });
    expect(later.fastTimes!.date).toBe('2026-03-12');
    expect(later.fastTimes!.iftar > '18:15').toBe(true); // sunsets get later through March
    expect(later.fastTimes!.sehriEnds < '05:37').toBe(true);
  });
});

describe('almanac', () => {
  it('puts the moon where published phase tables do, to within two minutes', () => {
    // New moon 29 Jan 2025 12:36 UTC; full moon 14 Mar 2025 06:55 UTC.
    for (const [iso, expected] of [['2025-01-29T12:36:00Z', 0], ['2025-03-14T06:55:00Z', 180]] as const) {
      const error = ((lunarElongation(Date.parse(iso)) - expected + 540) % 360) - 180;
      expect(Math.abs(error)).toBeLessThan(0.02); // the moon moves ~0.0085° a minute against the sun
    }
  });

  it('matches published sunrise and sunset to the minute', () => {
    const delhi = cityFor('delhi');
    expect(istClock(sunAltitudeTime('2025-06-21', delhi, -0.833, 'morning')!)).toBe('05:23');
    expect(istClock(sunAltitudeTime('2025-06-21', delhi, -0.833, 'evening')!)).toBe('19:22');
  });

  it('gives sehri before dawn and iftar at sunset', () => {
    const times = ramadanTimes('2026-02-19', cityFor('mumbai'));
    expect(times.sehriEnds < '06:00' && times.sehriEnds > '05:00').toBe(true);
    expect(times.iftar > '18:30' && times.iftar < '18:50').toBe(true);
  });

  it('finds the 2025 Ekadashi days', () => {
    const dates = ekadashiDays('2025-01-01', 365, cityFor('delhi')).map((day) => day.date);
    expect(dates.length).toBeGreaterThanOrEqual(24);
    for (const known of ['2025-01-10', '2025-06-06', '2025-07-06', '2025-12-01']) expect(dates).toContain(known);
    // Never two days in a row.
    for (let index = 1; index < dates.length; index += 1) {
      expect(Date.parse(dates[index]!) - Date.parse(dates[index - 1]!)).toBeGreaterThan(86_400_000 * 10);
    }
  });
});

describe('grocery amounts', () => {
  it('writes amounts the way they are bought, always rounding up', () => {
    expect(formatAmount('rice', 1234)).toEqual({ amount: '1.3 kg', detail: null });
    expect(formatAmount('rice', 420)).toEqual({ amount: '450 g', detail: null });
    expect(formatAmount('cumin', 7)).toEqual({ amount: '10 g', detail: null });
    expect(formatAmount('milk', 1750)).toEqual({ amount: '1.8 L', detail: null });
    expect(formatAmount('onion', 610)).toEqual({ amount: '6 onions', detail: 'about 650 g' });
    expect(formatAmount('eggs', 400)).toEqual({ amount: '8 eggs', detail: null });
    expect(formatAmount('curryLeaves', 40 * 0.2)).toEqual({ amount: '3 sprigs', detail: null });
    expect(formatAmount('salt', 0)).toEqual({ amount: null, detail: null });
  });

  it('adds up every portion in the household, and cooks Jain weeks without onion or garlic', () => {
    const { days, targets } = plan({ jain: true }, { diet: 'veg' });
    const single = buildGroceryList(days, { preferences: { ...DEFAULT_PREFERENCES, jain: true } });
    const names = single.groups.flatMap((group) => group.items.map((item) => item.name));
    expect(names).not.toContain('Onion');
    expect(names).not.toContain('Garlic');
    expect(names).not.toContain('Potato');

    const household = withHouseholdPortions(days, targets.calories, [{ id: 'm1', name: 'Asha', calories: targets.calories }], bySlug);
    const doubled = buildGroceryList(household, { preferences: { ...DEFAULT_PREFERENCES, jain: true } });
    const amountOf = (list: typeof single, name: string) =>
      list.groups.flatMap((group) => group.items).find((item) => item.name === name)?.amount;
    // Same target, same portions: the flour roughly doubles (rounding up may add a step).
    const grams = (text: string | null | undefined) => {
      const [value, unit] = (text ?? '0 g').split(' ');
      return Number(value) * (unit === 'kg' ? 1000 : 1);
    };
    const flour = 'Whole wheat flour (atta)';
    if (amountOf(single, flour)) {
      expect(grams(amountOf(doubled, flour))).toBeGreaterThanOrEqual(grams(amountOf(single, flour)) * 1.8);
    }
  });

  it('gives each household member whole-number portions scaled to their own target', () => {
    const { days, targets } = plan({}, { diet: 'veg' });
    const [day] = withHouseholdPortions(days, targets.calories, [{ id: 'kid', name: 'Riya', calories: targets.calories * 0.6 }], bySlug);
    for (const meal of day!.meals) {
      const portion = meal.portions![0]!;
      expect(portion.name).toBe('Riya');
      expect(portion.kcal).toBeLessThan(meal.kcal + 1);
      for (const item of portion.items) {
        if (['roti', 'idli', 'dosa', 'egg', 'paratha', 'pieces', 'piece'].includes(item.unit)) {
          expect(Number.isInteger(item.qty), `${meal.slug}: ${item.food}`).toBe(true);
        }
      }
    }
  });

  it('picks the strictest diet at the table', () => {
    expect(strictestDiet(['nonveg', 'egg'])).toBe('egg');
    expect(strictestDiet(['nonveg', 'veg', 'egg'])).toBe('veg');
    expect(strictestDiet(['nonveg'])).toBe('nonveg');
  });
});

describe('batch cooking', () => {
  it('never schedules prep to be eaten after its fridge life, and marinates the night before', () => {
    for (let seed = 1; seed <= 6; seed += 1) {
      const { days } = plan({}, { diet: 'nonveg' }, seed);
      const batch = buildBatchPlan(days);
      const index = (day: string) => WEEKDAYS.indexOf(day as (typeof WEEKDAYS)[number]);
      for (const session of batch.sessions) {
        // Sunday prep is done the day before Monday (-1); the Wednesday top-up on Wednesday (2).
        const doneOn = session.key === 'sunday' ? -1 : 2;
        for (const task of session.tasks) {
          expect(task.task).not.toBe('marinate');
          for (const meal of task.meals) {
            expect(index(meal.day) - doneOn, `${task.task} for ${meal.day}`).toBeLessThanOrEqual(PREP_TASKS[task.task].keepsDays);
            expect(index(meal.day)).toBeGreaterThan(doneOn);
          }
        }
      }
      for (const evening of batch.nightBefore) {
        for (const task of evening.tasks) expect(PREP_TASKS[task.task].keepsDays).toBe(1);
      }
    }
  });

  it('turns sprouts into the dry moong to soak', () => {
    const days = [
      {
        day: 'Mon',
        totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
        meals: [{ ...bySlug.get('sprouts-chaat')!, slot: 'midMorning' as const, time: '10:30 AM', mealId: 'x', factor: 1 }],
      },
    ];
    const task = buildBatchPlan(days).sessions[0]!.tasks.find((candidate) => candidate.task === 'sprout-moong')!;
    expect(task.amounts[0]!.name).toBe('Whole green moong, to sprout');
    expect(task.amounts[0]!.amount).toBe('50 g'); // 110 g of sprouts ÷ 2.3, rounded up to 5 g
  });
});
