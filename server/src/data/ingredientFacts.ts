/**
 * What the app needs to know about each ingredient to turn recipes into shopping amounts
 * and to sanity-check them: energy per 100 g (raw, as bought — approximate values from
 * standard Indian food tables), and how much one piece or spoon of it weighs.
 *
 * Keys match the ingredient registry in meals.ts.
 */
export interface IngredientFacts {
  /** kcal per 100 g (or 100 ml for liquids), as bought. */
  kcal100: number;
  /** Grams in one piece, for things counted (an egg, a lemon, an onion). */
  pieceGrams?: number;
  /** Grams in one level teaspoon; a tablespoon is three. Defaults to 3 g. */
  tspGrams?: number;
  /** Shop by count ("5 onions") rather than weight when this is set. */
  countAs?: string;
  /** Liquids shop in ml/L rather than g/kg. */
  liquid?: boolean;
  /** Not something anyone buys by quantity (salt, water): the list just names it. */
  toTaste?: boolean;
  /** For the Jain filter: onion, garlic, anything grown under the ground, and honey. */
  jainAvoid?: boolean;
  /** Allowed on a Hindu vrat (Navratri, Ekadashi): no grains, pulses, onion or garlic. */
  vrat?: boolean;
}

export const INGREDIENT_FACTS = {
  // Grains & Flours
  rice: { kcal100: 350 },
  atta: { kcal100: 340 },
  poha: { kcal100: 350 },
  sooji: { kcal100: 350 },
  oats: { kcal100: 380 },
  // Fermented batter as bought: rice, urad dal and water.
  batter: { kcal100: 140 },
  ragi: { kcal100: 330 },
  besan: { kcal100: 380 },
  bread: { kcal100: 250, pieceGrams: 30, countAs: 'slice' },
  pav: { kcal100: 270, pieceGrams: 40, countAs: 'pav' },
  dalia: { kcal100: 340 },
  murmura: { kcal100: 380 },
  riceFlour: { kcal100: 360 },

  // Lentils & Legumes
  toorDal: { kcal100: 340 },
  moongDal: { kcal100: 350 },
  masoorDal: { kcal100: 340 },
  chanaDal: { kcal100: 360 },
  uradDal: { kcal100: 340 },
  rajma: { kcal100: 330 },
  kabuliChana: { kcal100: 360 },
  kalaChana: { kcal100: 360 },
  driedPeas: { kcal100: 330 },
  // Home-sprouted whole moong (short sprouts).
  sprouts: { kcal100: 110 },
  soya: { kcal100: 345 },
  sattu: { kcal100: 400 },

  // Dairy & Paneer
  milk: { kcal100: 60, liquid: true, vrat: true },
  curd: { kcal100: 60, vrat: true },
  paneer: { kcal100: 265, vrat: true },
  ghee: { kcal100: 900, tspGrams: 5, vrat: true },
  butter: { kcal100: 720, tspGrams: 5, vrat: true },
  buttermilk: { kcal100: 20, liquid: true, vrat: true },
  tofu: { kcal100: 110 },

  // Eggs
  eggs: { kcal100: 140, pieceGrams: 50, countAs: 'egg' },

  // Meat & Fish (edible portion)
  chicken: { kcal100: 120 },
  chickenCurryCut: { kcal100: 150 },
  chickenMince: { kcal100: 150 },
  fish: { kcal100: 100 },
  muttonKeema: { kcal100: 190 },
  prawns: { kcal100: 90 },

  // Vegetables & Fruits
  onion: { kcal100: 40, pieceGrams: 110, countAs: 'onion', jainAvoid: true },
  tomato: { kcal100: 20, pieceGrams: 90, countAs: 'tomato', vrat: true },
  potato: { kcal100: 80, pieceGrams: 150, jainAvoid: true, vrat: true },
  greenChilli: { kcal100: 40, pieceGrams: 5, countAs: 'chilli', vrat: true },
  ginger: { kcal100: 80, tspGrams: 5, jainAvoid: true, vrat: true },
  garlic: { kcal100: 150, pieceGrams: 4, countAs: 'clove', jainAvoid: true },
  coriander: { kcal100: 25, tspGrams: 1, vrat: true },
  curryLeaves: { kcal100: 100, pieceGrams: 0.2, countAs: 'leaf', vrat: true },
  mint: { kcal100: 45, tspGrams: 1, vrat: true },
  lemon: { kcal100: 30, pieceGrams: 60, countAs: 'lemon', vrat: true },
  spinach: { kcal100: 25, vrat: true },
  methi: { kcal100: 50 },
  cauliflower: { kcal100: 25 },
  cabbage: { kcal100: 25 },
  carrot: { kcal100: 40, jainAvoid: true },
  beans: { kcal100: 35 },
  peas: { kcal100: 80 },
  capsicum: { kcal100: 25, vrat: true },
  lauki: { kcal100: 15, vrat: true },
  brinjal: { kcal100: 25 },
  cucumber: { kcal100: 15, vrat: true },
  banana: { kcal100: 90, pieceGrams: 120, countAs: 'banana', vrat: true },
  apple: { kcal100: 55, pieceGrams: 150, countAs: 'apple', vrat: true },
  papaya: { kcal100: 40, vrat: true },
  corn: { kcal100: 90 },

  // Nuts, Seeds & Oils
  oil: { kcal100: 900, tspGrams: 4.5, liquid: true, vrat: true },
  mustardOil: { kcal100: 900, tspGrams: 4.5, liquid: true },
  peanuts: { kcal100: 570, tspGrams: 5, vrat: true },
  almonds: { kcal100: 600, pieceGrams: 1.2, vrat: true },
  walnuts: { kcal100: 650, pieceGrams: 4, vrat: true },
  sesame: { kcal100: 570, tspGrams: 3 },
  coconut: { kcal100: 350, tspGrams: 3, vrat: true },
  makhana: { kcal100: 350, vrat: true },
  poppySeeds: { kcal100: 525, tspGrams: 3 },
  flaxSeeds: { kcal100: 530, tspGrams: 3, vrat: true },

  // Spices & Others
  salt: { kcal100: 0, toTaste: true },
  turmeric: { kcal100: 310, tspGrams: 3 },
  chilliPowder: { kcal100: 280, tspGrams: 2.5 },
  cumin: { kcal100: 375, tspGrams: 2.5, vrat: true },
  mustardSeeds: { kcal100: 500, tspGrams: 3.5 },
  garamMasala: { kcal100: 380, tspGrams: 2.5 },
  corianderPowder: { kcal100: 300, tspGrams: 2 },
  sambarPowder: { kcal100: 320, tspGrams: 2.5 },
  chaatMasala: { kcal100: 200, tspGrams: 2.5 },
  tandooriMasala: { kcal100: 300, tspGrams: 2.5 },
  panchPhoron: { kcal100: 400, tspGrams: 3 },
  kasuriMethi: { kcal100: 320, tspGrams: 1 },
  bayLeaf: { kcal100: 310, pieceGrams: 0.2, countAs: 'leaf' },
  pepper: { kcal100: 250, tspGrams: 2.5, vrat: true },
  hing: { kcal100: 300, tspGrams: 2 },
  tamarind: { kcal100: 240 },
  jaggery: { kcal100: 380, tspGrams: 5 },
  sugar: { kcal100: 400, tspGrams: 4, vrat: true },
  honey: { kcal100: 300, tspGrams: 7, jainAvoid: true, vrat: true },
  tea: { kcal100: 0, tspGrams: 2, vrat: true },
  eno: { kcal100: 0, tspGrams: 5 },

  // Fasting (vrat) staples, used by the vrat dishes
  sabudana: { kcal100: 350, vrat: true },
  kuttuFlour: { kcal100: 340, vrat: true },
  samak: { kcal100: 340, vrat: true },
  rajgiraFlour: { kcal100: 370, vrat: true },
  singharaFlour: { kcal100: 350, vrat: true },
  sweetPotato: { kcal100: 90, jainAvoid: true, vrat: true },
  rockSalt: { kcal100: 0, toTaste: true, vrat: true },
  dates: { kcal100: 280, pieceGrams: 8, countAs: 'date', vrat: true },
  pumpkin: { kcal100: 25, vrat: true },
} as const satisfies Record<string, IngredientFacts>;
