import type { RecipeIngredient } from '@/lib/types';

const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** 1.5 → "1½", 0.25 → "¼", 3 → "3". Rounds to the nearest quarter. */
export function quarter(value: number): string {
  const rounded = Math.round(value * 4) / 4;
  const whole = Math.floor(rounded);
  const part = Math.round((rounded - whole) * 100) / 100;
  if (part === 0) return String(whole);
  return `${whole > 0 ? whole : ''}${FRACTIONS[part] ?? part.toFixed(2)}`;
}

const PLURALS: Record<string, string> = {
  chilli: 'chillies',
  leaf: 'leaves',
  tomato: 'tomatoes',
  pav: 'pav',
  slice: 'slices',
};
/** Counted whole in a scaled recipe. */
const WHOLE_PIECES = new Set(['chilli', 'clove', 'date', 'egg', 'leaf', 'pav', 'slice']);

const plural = (word: string, count: number) => (count <= 1 ? word : (PLURALS[word] ?? `${word}s`));

function grams(value: number, unit: 'g' | 'ml'): string {
  if (unit === 'ml' && value >= 1000) return `${quarter(value / 1000)} L`;
  if (unit === 'g' && value >= 1000) return `${(Math.round(value / 50) * 50 / 1000).toLocaleString('en-IN')} kg`;
  const step = value < 10 ? 1 : value < 100 ? 5 : 10;
  return `${Math.max(1, Math.round(value / step) * step)} ${unit}`;
}

/**
 * A recipe amount scaled for how many servings are being cooked, written the way a cook
 * measures: quarters of a spoon, whole-ish pieces, grams rounded to a kitchen scale.
 */
export function scaledAmount(ingredient: Pick<RecipeIngredient, 'qty' | 'unit' | 'countAs'>, scale: number): string {
  const amount = ingredient.qty * scale;
  switch (ingredient.unit) {
    case 'taste':
      return 'to taste';
    case 'pinch':
      return amount <= 1.25 ? 'a pinch' : `${Math.round(amount)} pinches`;
    case 'g':
    case 'ml':
      return grams(amount, ingredient.unit);
    case 'tsp':
    case 'tbsp': {
      const teaspoons = ingredient.unit === 'tbsp' ? amount * 3 : amount;
      // A spoonful of three teaspoons or more reads better as tablespoons.
      return teaspoons >= 3 ? `${quarter(teaspoons / 3)} tbsp` : `${quarter(Math.max(0.25, teaspoons))} tsp`;
    }
    case 'pc': {
      const word = ingredient.countAs;
      // Things you can't sensibly cut (a date, an egg, a clove) are counted whole; bigger ones can be halved.
      const whole = word !== null && WHOLE_PIECES.has(word);
      const counted = whole ? Math.max(1, Math.round(amount)) : Math.max(0.25, amount);
      const text = whole ? String(counted) : quarter(counted);
      return word ? `${text} ${plural(word, counted)}` : text;
    }
  }
}

/** Servings as people read them: "1 serving", "2½ servings". */
export function servingsLabel(servings: number): string {
  return `${quarter(servings)} ${servings === 1 ? 'serving' : 'servings'}`;
}
