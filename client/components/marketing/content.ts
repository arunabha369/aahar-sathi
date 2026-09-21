/**
 * Landing-page content. Every dish, count and number here matches the real meal
 * database and the demo profile (29, male, 74 kg, 175 cm, moderate, weight loss),
 * so nothing on the page promises something the app does not do.
 */

export interface Dish {
  slug: string;
  name: string;
  region: 'North' | 'South' | 'East' | 'West';
  kcal: number;
}

/** The 15 dishes that have photography, in marquee order (regions interleaved). */
export const DISHES: Dish[] = [
  { slug: 'idli-sambar', name: 'Idli with sambar', region: 'South', kcal: 354 },
  { slug: 'rajma-chawal', name: 'Rajma chawal', region: 'North', kcal: 520 },
  { slug: 'khaman-dhokla', name: 'Khaman dhokla', region: 'West', kcal: 204 },
  { slug: 'moong-khichdi-curd', name: 'Moong dal khichdi', region: 'East', kcal: 467 },
  { slug: 'palak-paneer-roti', name: 'Palak paneer with roti', region: 'North', kcal: 605 },
  { slug: 'masala-dosa-sambar', name: 'Masala dosa', region: 'South', kcal: 496 },
  { slug: 'poha-peanuts', name: 'Poha with peanuts', region: 'West', kcal: 411 },
  { slug: 'dal-rice-mixed-veg', name: 'Dal, rice and sabzi', region: 'East', kcal: 531 },
  { slug: 'chole-jeera-rice', name: 'Chole with jeera rice', region: 'North', kcal: 545 },
  { slug: 'sprouts-chaat', name: 'Sprouts chaat', region: 'West', kcal: 149 },
  { slug: 'egg-curry-rice', name: 'Egg curry with rice', region: 'North', kcal: 543 },
  { slug: 'paneer-bhurji-roti', name: 'Paneer bhurji with roti', region: 'North', kcal: 632 },
  { slug: 'moong-dal-chilla-curd', name: 'Moong dal chilla', region: 'North', kcal: 367 },
  { slug: 'tandoori-chicken-roti', name: 'Tandoori chicken', region: 'North', kcal: 539 },
  { slug: 'paneer-paratha-curd', name: 'Paneer paratha with curd', region: 'North', kcal: 402 },
];

/** Dish counts per region come straight from server/src/data/meals.ts. */
export const REGIONS = [
  {
    name: 'North Indian',
    photo: 'rajma-chawal',
    count: 23,
    dishes: ['Rajma chawal', 'Palak paneer', 'Besan chilla', 'Chole'],
  },
  {
    name: 'South Indian',
    photo: 'masala-dosa-sambar',
    count: 15,
    dishes: ['Idli sambar', 'Masala dosa', 'Ragi dosa', 'Ven pongal'],
  },
  {
    name: 'Eastern',
    photo: 'moong-khichdi-curd',
    count: 14,
    dishes: ['Moong dal khichdi', 'Ghugni', 'Chirer pulao', 'Dimer jhol'],
  },
  {
    name: 'Western',
    photo: 'khaman-dhokla',
    count: 12,
    dishes: ['Khaman dhokla', 'Poha', 'Methi thepla', 'Pithla'],
  },
] as const;

/** The demo profile's real numbers, used by the hero card and "How it works". */
export const DEMO = {
  bmr: 1694,
  multiplier: 1.55,
  tdee: 2625,
  deficit: 500,
  calories: 2125,
  protein: 104,
  carbs: 295,
  fat: 59,
  water: 11,
} as const;

export const COMPARISON = [
  {
    problem: 'Oats, quinoa and 150 g of grilled chicken breast',
    answer: 'Poha, rajma chawal, idli sambar — the food already in your kitchen',
  },
  {
    problem: '“Eat 142 g of rice” — with no kitchen scale',
    answer: 'Portions in bowls, katoris, rotis and glasses',
  },
  {
    problem: 'One 1,500 kcal chart handed to everyone',
    answer: 'Targets worked out from your age, height, weight and activity',
  },
  {
    problem: 'A PDF that is stale the day you get it',
    answer: 'Swap any dish, reshuffle the week, and the grocery list follows',
  },
] as const;

export const METHOD = [
  { label: 'Energy at rest', value: 'Mifflin–St Jeor BMR' },
  { label: 'Daily burn', value: 'BMR × 1.2 to 1.9, by activity' },
  { label: 'Goal', value: '−500 kcal loss · 0 maintain · +300 gain' },
  { label: 'Safety floor', value: 'Never below 1,200 kcal (women) or 1,500 (men)' },
  { label: 'BMI bands', value: 'Asian-Indian cut-offs at 23 and 25' },
  { label: 'Protein', value: '1.0–1.6 g per kg of healthy body weight' },
  { label: 'Water', value: '35 ml per kg, +500 ml if you train hard' },
] as const;

export const FAQ = [
  {
    q: 'Does it cost anything?',
    a: 'No. There is no payment and nothing to install — it runs in your browser on phone or laptop.',
  },
  {
    q: 'I am vegetarian. Will I get meat or eggs?',
    a: 'Never. Plans are strictly vegetarian, eggetarian or non-vegetarian, whichever you choose. Eggetarian plans include at least one egg dish a day; non-vegetarian plans include chicken, fish or meat at lunch or dinner.',
  },
  {
    q: 'Do I need to weigh my food?',
    a: 'No. Every portion is in household measures — bowls, katoris, rotis, idlis, glasses and spoons. Grams appear only for the few things you buy by weight, like paneer, chicken, fish or roasted chana.',
  },
  {
    q: 'How are my calories worked out?',
    a: 'We use the Mifflin–St Jeor equation for your resting energy, multiply it by your activity level, then adjust for your goal. The dashboard shows every step of the calculation, so you can check it.',
  },
  {
    q: 'What if I do not like a dish?',
    a: 'Swap it. You get another dish that fits the same share of your calories, and your grocery list updates. You can also reshuffle the whole week.',
  },
  {
    q: 'Can I follow a Jain diet?',
    a: 'Not yet. Plans can include onion, garlic and root vegetables, and there is no Jain or fasting mode at the moment.',
  },
  {
    q: 'Is this medical advice?',
    a: 'No. It is general guidance for healthy adults. If you are pregnant, breastfeeding, or managing diabetes, thyroid, kidney or heart conditions, please talk to a doctor or dietitian first.',
  },
] as const;
