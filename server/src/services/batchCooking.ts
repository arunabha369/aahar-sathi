import type { IngredientKey } from '../data/meals.ts';
import { ingredientsFor, recipeFor, type PrepTask } from '../data/recipes/index.ts';
import { formatAmount, formatWeight } from './grocery.ts';
import { gramsOf } from './recipeMath.ts';
import { ingredientInfo } from '../data/meals.ts';
import { WEEKDAYS, type PlanDay, type PlanInputs, type PlanMeal, type Weekday } from '../types.ts';

interface TaskInfo {
  title: string;
  how: string;
  /** Days it keeps in the fridge once done. */
  keepsDays: number;
  storage: string;
  /** Ingredients this job prepares, in recipes that list it. */
  keys: readonly IngredientKey[];
}

/**
 * What each job involves and how long its result keeps. Shelf lives are the cautious end of
 * usual home-kitchen guidance for a fridge at 4 °C or below; when in doubt, smell and look.
 */
export const PREP_TASKS: Record<PrepTask, TaskInfo> = {
  'soak-cook-legumes': {
    title: 'Soak and pressure-cook legumes',
    how: 'Soak overnight, pressure-cook until completely soft, and cool quickly. Pack each meal’s share in its own box with a little cooking water.',
    keepsDays: 4,
    storage: 'Fridge up to 4 days, or freeze for 3 months',
    keys: ['rajma', 'kabuliChana', 'kalaChana', 'driedPeas'],
  },
  'cook-dal': {
    title: 'Cook dal',
    how: 'Pressure-cook plain with turmeric and salt. Temper each portion fresh when you eat it — the tadka is what tastes fresh.',
    keepsDays: 3,
    storage: 'Fridge up to 3 days',
    keys: ['toorDal', 'moongDal', 'masoorDal', 'chanaDal', 'uradDal'],
  },
  'roti-dough': {
    title: 'Knead roti dough',
    how: 'Knead soft, rub with a few drops of oil, and keep in an airtight box. Bring to room temperature for 10 minutes before rolling.',
    keepsDays: 2,
    storage: 'Fridge up to 2 days',
    keys: ['atta'],
  },
  batter: {
    title: 'Make idli and dosa batter',
    how: 'Soak 3 parts rice to 1 part urad dal for 6 hours, grind, and ferment overnight until risen — or buy fresh batter.',
    keepsDays: 4,
    storage: 'Fridge up to 4 days after fermenting',
    keys: ['batter'],
  },
  'coconut-chutney': {
    title: 'Grind coconut chutney',
    how: 'Grind and refrigerate without the tempering; temper just before serving. Freeze extra in an ice-cube tray.',
    keepsDays: 2,
    storage: 'Fridge up to 2 days, or freeze for a month',
    keys: ['coconut'],
  },
  'green-chutney': {
    title: 'Blend green chutney',
    how: 'Blend coriander (and mint) with chilli, lemon and salt. The lemon keeps it green.',
    keepsDays: 4,
    storage: 'Fridge up to 4 days',
    keys: ['coriander', 'mint'],
  },
  'chop-vegetables': {
    title: 'Wash and chop vegetables',
    how: 'Wash, dry well and chop. Store in airtight boxes lined with kitchen paper. Leave tomatoes whole — they go watery once cut.',
    keepsDays: 3,
    storage: 'Fridge up to 3 days',
    keys: ['onion', 'beans', 'carrot', 'capsicum', 'cabbage', 'cauliflower'],
  },
  'ginger-garlic-paste': {
    title: 'Make ginger-garlic paste',
    how: 'Blend peeled ginger and garlic with a spoonful of oil and a pinch of salt. Use a clean, dry spoon every time.',
    keepsDays: 14,
    storage: 'Fridge up to 2 weeks in a clean glass jar',
    keys: ['ginger', 'garlic'],
  },
  'boil-potatoes': {
    title: 'Boil potatoes',
    how: 'Boil in their skins until a knife slides in, cool, and refrigerate unpeeled.',
    keepsDays: 3,
    storage: 'Fridge up to 3 days',
    keys: ['potato', 'sweetPotato'],
  },
  'boil-eggs': {
    title: 'Hard-boil eggs',
    how: 'Boil for 10 minutes, cool in cold water, and refrigerate in their shells. Peel when you need them.',
    keepsDays: 7,
    storage: 'Fridge up to a week, unpeeled',
    keys: ['eggs'],
  },
  'tamarind-pulp': {
    title: 'Make tamarind pulp',
    how: 'Soak the tamarind in hot water for 20 minutes, squeeze, and strain out the fibres and seeds.',
    keepsDays: 14,
    storage: 'Fridge up to 2 weeks',
    keys: ['tamarind'],
  },
  'sprout-moong': {
    title: 'Sprout whole moong',
    how: 'Soak whole green moong for 8 hours, drain, and leave covered in a warm spot for a day or two until short tails show. Then refrigerate.',
    keepsDays: 3,
    storage: 'Fridge up to 3 days',
    keys: ['sprouts'],
  },
  'onion-tomato-masala': {
    title: 'Cook onion-tomato masala',
    how: 'Cook chopped onion, tomato, ginger and garlic in oil until the oil separates. It is the base for most curries in the week.',
    keepsDays: 5,
    storage: 'Fridge up to 5 days, or freeze in portions',
    keys: ['onion', 'tomato'],
  },
  'roast-nuts': {
    title: 'Roast peanuts and makhana',
    how: 'Dry-roast on low heat until they crackle, cool completely, and store airtight.',
    keepsDays: 21,
    storage: 'Airtight jar up to 3 weeks',
    keys: ['peanuts', 'makhana'],
  },
  marinate: {
    title: 'Marinate',
    how: 'Mix the marinade and coat the paneer, chicken or fish; cover and refrigerate overnight.',
    keepsDays: 1,
    storage: 'Fridge overnight',
    keys: ['paneer', 'chicken', 'chickenCurryCut', 'fish', 'prawns'],
  },
};

/** When one ingredient could go to two jobs, the more specific job takes it. */
const TASK_PRIORITY: readonly PrepTask[] = [
  'onion-tomato-masala',
  'ginger-garlic-paste',
  'soak-cook-legumes',
  'cook-dal',
  'roti-dough',
  'batter',
  'sprout-moong',
  'boil-potatoes',
  'boil-eggs',
  'tamarind-pulp',
  'roast-nuts',
  'coconut-chutney',
  'green-chutney',
  'chop-vegetables',
  'marinate',
];

/** Sprouts weigh about 2.3× the dry moong they grow from. */
const SPROUT_YIELD = 2.3;
/** Fermented batter is roughly 30% rice and 10% urad dal by weight. */
const BATTER_RICE_SHARE = 0.3;
const BATTER_URAD_SHARE = 0.1;

export interface PrepAmount {
  name: string;
  amount: string | null;
  detail: string | null;
}

export interface PrepMealRef {
  day: Weekday;
  name: string;
}

export interface BatchTask {
  task: PrepTask;
  title: string;
  how: string;
  storage: string;
  amounts: PrepAmount[];
  meals: PrepMealRef[];
}

export interface BatchSession {
  key: 'sunday' | 'wednesday';
  title: string;
  /** The plan days whose meals it covers. */
  covers: Weekday[];
  tasks: BatchTask[];
}

export interface BatchPlan {
  sessions: BatchSession[];
  /** Jobs that only keep a day, listed on the evening before the meal. */
  nightBefore: { day: Weekday; tasks: BatchTask[] }[];
  /** Short-lived jobs for days no session reaches: done fresh on the day. */
  onTheDay: { day: Weekday; tasks: BatchTask[] }[];
}

interface Need {
  task: PrepTask;
  dayIndex: number;
  meal: PlanMeal;
  grams: Map<IngredientKey, number>;
}

function servingsOf(meal: PlanMeal): number {
  return meal.factor + (meal.portions ?? []).reduce((sum, portion) => sum + portion.factor, 0);
}

/** Every job each meal needs, with the amounts it prepares for that meal. */
function needsOf(days: PlanDay[], jain: boolean): Need[] {
  const needs: Need[] = [];
  days.forEach((day, dayIndex) => {
    for (const meal of day.meals) {
      const recipe = recipeFor(meal.slug);
      if (!recipe?.prepAhead?.length) continue;
      const servings = servingsOf(meal);
      const listed = new Set(recipe.prepAhead);
      const byTask = new Map<PrepTask, Map<IngredientKey, number>>();
      for (const ingredient of ingredientsFor(recipe, { jain, vrat: day.kind === 'vrat' })) {
        const task = TASK_PRIORITY.find((candidate) => listed.has(candidate) && PREP_TASKS[candidate].keys.includes(ingredient.key));
        if (!task) continue;
        const grams = byTask.get(task) ?? new Map<IngredientKey, number>();
        grams.set(ingredient.key, (grams.get(ingredient.key) ?? 0) + gramsOf(ingredient) * servings);
        byTask.set(task, grams);
      }
      for (const [task, grams] of byTask) needs.push({ task, dayIndex, meal, grams });
    }
  });
  return needs;
}

function amountsFor(grams: Map<IngredientKey, number>): PrepAmount[] {
  return [...grams]
    .flatMap(([key, total]): PrepAmount[] => {
      if (key === 'sprouts') {
        return [
          {
            name: 'Whole green moong, to sprout',
            amount: formatWeight(total / SPROUT_YIELD),
            detail: `makes about ${formatWeight(total)} of sprouts`,
          },
        ];
      }
      if (key === 'batter') {
        return [
          {
            name: ingredientInfo(key).name,
            ...formatAmount(key, total),
            detail: `or grind ${formatWeight(total * BATTER_RICE_SHARE)} rice and ${formatWeight(total * BATTER_URAD_SHARE)} urad dal`,
          },
        ];
      }
      return [{ name: ingredientInfo(key).name, ...formatAmount(key, total) }];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function toTask(task: PrepTask, needs: Need[]): BatchTask {
  const grams = new Map<IngredientKey, number>();
  for (const need of needs) {
    for (const [key, value] of need.grams) grams.set(key, (grams.get(key) ?? 0) + value);
  }
  const info = PREP_TASKS[task];
  return {
    task,
    title: info.title,
    how: info.how,
    storage: info.storage,
    amounts: amountsFor(grams),
    meals: needs.map((need) => ({ day: WEEKDAYS[need.dayIndex]!, name: need.meal.name })),
  };
}

const SUNDAY_LAST = 2; // a Sunday session reaches Wednesday at most
const WEDNESDAY_FIRST = 3;

/**
 * The week's prep, grouped into a Sunday session (for Monday–Wednesday, or the whole week
 * for things that keep) and a Wednesday top-up (Thursday on). Nothing is scheduled to be
 * eaten after it would have gone past its fridge life.
 */
export function buildBatchPlan(days: PlanDay[], inputs?: Pick<PlanInputs, 'preferences'>): BatchPlan {
  const needs = needsOf(days, inputs?.preferences?.jain ?? false);
  const sunday = new Map<PrepTask, Need[]>();
  const wednesday = new Map<PrepTask, Need[]>();
  const nightBefore = new Map<number, Map<PrepTask, Need[]>>();
  const onTheDay = new Map<number, Map<PrepTask, Need[]>>();
  const push = (target: Map<PrepTask, Need[]>, need: Need) => target.set(need.task, [...(target.get(need.task) ?? []), need]);
  const pushDay = (target: Map<number, Map<PrepTask, Need[]>>, day: number, need: Need) => {
    const tasks = target.get(day) ?? new Map<PrepTask, Need[]>();
    push(tasks, need);
    target.set(day, tasks);
  };

  for (const need of needs) {
    const { keepsDays } = PREP_TASKS[need.task];
    if (keepsDays <= 1) {
      pushDay(nightBefore, need.dayIndex, need);
    } else if (keepsDays >= 7 || need.dayIndex <= Math.min(keepsDays - 1, SUNDAY_LAST)) {
      push(sunday, need);
    } else if (need.dayIndex >= WEDNESDAY_FIRST && need.dayIndex <= WEDNESDAY_FIRST + keepsDays - 1) {
      push(wednesday, need);
    } else {
      pushDay(onTheDay, need.dayIndex, need);
    }
  }

  const tasksOf = (group: Map<PrepTask, Need[]>) =>
    TASK_PRIORITY.filter((task) => group.has(task)).map((task) => toTask(task, group.get(task)!));
  const byDay = (group: Map<number, Map<PrepTask, Need[]>>) =>
    [...group.keys()].sort((a, b) => a - b).map((day) => ({ day: WEEKDAYS[day]!, tasks: tasksOf(group.get(day)!) }));

  const coveredDays = (group: Map<PrepTask, Need[]>) => {
    const indexes = new Set([...group.values()].flat().map((need) => need.dayIndex));
    return WEEKDAYS.filter((_, index) => indexes.has(index));
  };
  const sessions: BatchSession[] = [];
  if (sunday.size > 0) {
    sessions.push({ key: 'sunday', title: 'Sunday prep', covers: coveredDays(sunday), tasks: tasksOf(sunday) });
  }
  if (wednesday.size > 0) {
    sessions.push({ key: 'wednesday', title: 'Wednesday top-up', covers: coveredDays(wednesday), tasks: tasksOf(wednesday) });
  }
  return { sessions, nightBefore: byDay(nightBefore), onTheDay: byDay(onTheDay) };
}
