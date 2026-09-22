/** Response types for the Express API. These mirror server/src/types.ts. */

export type Gender = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type Goal = 'loss' | 'maintain' | 'gain';
export type Diet = 'veg' | 'egg' | 'nonveg';
export type Cuisine = 'north' | 'south' | 'east' | 'west' | 'mix';
export type Region = 'north' | 'south' | 'east' | 'west' | 'pan';
export type PlanSlot = 'breakfast' | 'midMorning' | 'lunch' | 'eveningSnack' | 'dinner';
export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
export type IngredientCategory =
  | 'Grains & Flours'
  | 'Lentils & Legumes'
  | 'Dairy & Paneer'
  | 'Eggs'
  | 'Meat & Fish'
  | 'Vegetables & Fruits'
  | 'Nuts, Seeds & Oils'
  | 'Spices & Others';

export interface Profile {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
  diet: Diet;
  cuisine: Cuisine;
}

export interface Targets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterGlasses: number;
  bmi: number;
  bmiCategory: BmiCategory;
  notes: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile: Partial<Profile>;
  profileComplete: boolean;
  createdAt: string;
}

export interface MealItem {
  qty: number;
  unit: string;
  food: string;
}

export interface MealIngredient {
  name: string;
  category: IngredientCategory;
}

/** A household member's share of a planned meal. */
export interface MemberPortion {
  memberId: string;
  name: string;
  factor: number;
  items: MealItem[];
  kcal: number;
}

export interface PlanMeal {
  slot: PlanSlot;
  time: string;
  mealId: string;
  slug: string;
  name: string;
  diet: Diet;
  region: Region;
  factor: number;
  items: MealItem[];
  ingredients: MealIngredient[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Replaces the slot's name on fast days ("Sehri", "Iftar"). */
  label?: string;
  portions?: MemberPortion[];
}

export interface DayTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type DayKind = 'normal' | 'vrat' | 'ramadan';

export interface FastTimes {
  date: string;
  /** "HH:MM", 24-hour, India time. */
  sehriEnds: string;
  iftar: string;
}

export interface PlanDay {
  day: string;
  meals: PlanMeal[];
  totals: DayTotals;
  kind?: DayKind;
  fastTimes?: FastTimes;
}

export type FastingMode = 'none' | 'navratri' | 'ekadashi' | 'ramadan';
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface PlanPreferences {
  jain: boolean;
  fasting: FastingMode;
  vratDays: Weekday[];
  city: string | null;
}

export interface UserPreferences extends PlanPreferences {
  calorieAdjustment: number;
  calorieAdjustedAt: string | null;
  suggestionDismissedAt: string | null;
}

export interface HouseholdMemberSnapshot {
  id: string;
  name: string;
  calories: number;
}

export interface PlanInputs extends Profile {
  preferences?: PlanPreferences;
  /** The options as the user chose them; an edit starts from these. */
  chosenPreferences?: PlanPreferences;
  calorieAdjustment?: number;
  household?: HouseholdMemberSnapshot[];
}

export interface Plan {
  id: string;
  inputs: PlanInputs;
  targets: Targets;
  days: PlanDay[];
  groceryChecked: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanSummary {
  id: string;
  goal: Goal;
  diet: Diet;
  cuisine: Cuisine;
  calories: number;
  protein: number;
  bmi: number;
  bmiCategory: BmiCategory;
  fasting: FastingMode;
  jain: boolean;
  people: number;
  dishes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroceryItem {
  name: string;
  /** "1.2 kg", "6 onions"; null for things bought by eye (salt). */
  amount: string | null;
  detail: string | null;
}

export interface GroceryGroup {
  category: IngredientCategory;
  items: GroceryItem[];
}

export interface WaterLog {
  date: string;
  glasses: number;
}

export interface WeightLog {
  date: string;
  weightKg: number;
}

/** One night, dated by the morning the user woke up. Times are 24-hour "HH:MM". */
export interface SleepLog {
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
}

/* ---- Response envelopes ---- */

export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
    details?: { field: string; message: string }[];
  };
}

export interface UserResponse {
  user: User;
}

export interface ProfileResponse {
  profile: Partial<Profile>;
  profileComplete: boolean;
  preferences: UserPreferences;
  targets: Targets | null;
}

export interface ProfileUpdateResponse {
  user: User;
  profile: Profile;
  targets: Targets;
}

export interface PlanResponse {
  plan: Plan;
}

export interface ActivePlanResponse {
  plan: Plan | null;
}

export interface PlanListResponse {
  plans: PlanSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GroceryResponse {
  planId: string;
  groups: GroceryGroup[];
  total: number;
  checked: string[];
  /** Items on this list the user already has at home (kept across plans). */
  atHome: string[];
  /** People the amounts feed: the user plus their household. */
  servings: number;
}

export interface PantryResponse {
  items: string[];
}

export interface GroceryUpdateResponse {
  checked: string[];
}

export interface WaterLogsResponse {
  from: string;
  to: string;
  logs: WaterLog[];
}

export interface WeightLogsResponse {
  from: string;
  to: string;
  logs: WeightLog[];
}

export interface SleepLogsResponse {
  from: string;
  to: string;
  logs: SleepLog[];
}

export interface OkResponse {
  ok: true;
}

// ---------- Food diary ----------

export type CheckinStatus = 'eaten' | 'skipped' | 'swapped';
export type FoodSource = 'meal' | 'custom' | 'barcode';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A planned meal on a diary day, with what happened to it. */
export interface DiaryPlannedMeal extends Macros {
  slot: PlanSlot;
  time: string;
  label?: string;
  slug: string;
  name: string;
  items: MealItem[];
  status: CheckinStatus | null;
}

export interface DiaryCheckin extends Macros {
  slot: PlanSlot;
  status: CheckinStatus;
  mealName: string;
}

export interface FoodEntry extends Macros {
  id: string;
  slot: PlanSlot | null;
  source: FoodSource;
  ref: string | null;
  name: string;
  servingLabel: string;
  servings: number;
  createdAt: string;
}

export interface DiaryDay {
  date: string;
  weekday: string;
  kind: DayKind;
  fastTimes?: FastTimes;
  planned: DiaryPlannedMeal[];
  checkins: DiaryCheckin[];
  entries: FoodEntry[];
  eaten: Macros;
  targets: Targets | null;
}

export interface CustomFood extends Macros {
  id: string;
  name: string;
  servingLabel: string;
}

export interface FoodSearchResponse {
  meals: (Macros & { slug: string; name: string; servingLabel: string })[];
  custom: CustomFood[];
}

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand: string | null;
  per100: Macros | null;
  perServing: Macros | null;
  servingLabel: string | null;
  servingGrams: number | null;
  liquid: boolean;
}

export interface DiaryDaySummary extends Macros {
  date: string;
  eatenMeals: number;
  skippedMeals: number;
  swappedMeals: number;
  entries: number;
}

export interface DiarySummary {
  from: string;
  to: string;
  target: Pick<Targets, 'calories' | 'protein' | 'carbs' | 'fat'> | null;
  days: DiaryDaySummary[];
  streak: number;
  week: { plannedMeals: number; eatenAsPlanned: number; trackedDays: number; onTargetDays: number };
}

// ---------- Recipes ----------

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealTag = 'vrat' | 'jain' | 'fastOnly' | 'sehri' | 'iftar';
export type RecipeUnit = 'g' | 'ml' | 'pc' | 'tsp' | 'tbsp' | 'pinch' | 'taste';

export interface RecipeSummary {
  slug: string;
  name: string;
  slot: MealSlot;
  diet: Diet;
  region: Region;
  tags: MealTag[];
  kcal: number;
  protein: number;
  /** Prep plus cooking. */
  minutes: number;
}

export interface RecipeIngredient {
  key: string;
  name: string;
  category: IngredientCategory;
  qty: number;
  unit: RecipeUnit;
  note: string | null;
  optional: boolean;
  grams: number;
  countAs: string | null;
  jainAvoid: boolean;
}

export interface Recipe extends Omit<RecipeSummary, 'minutes'> {
  items: MealItem[];
  carbs: number;
  fat: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tip: string | null;
  prepAhead: { task: string; title: string; storage: string }[];
  jainNotes: string[];
}

// ---------- Batch cooking ----------

export interface PrepAmount {
  name: string;
  amount: string | null;
  detail: string | null;
}

export interface BatchTask {
  task: string;
  title: string;
  how: string;
  storage: string;
  amounts: PrepAmount[];
  meals: { day: Weekday; name: string }[];
}

export interface PrepPlanResponse {
  planId: string;
  sessions: { key: 'sunday' | 'wednesday'; title: string; covers: Weekday[]; tasks: BatchTask[] }[];
  nightBefore: { day: Weekday; tasks: BatchTask[] }[];
  onTheDay: { day: Weekday; tasks: BatchTask[] }[];
}

// ---------- Fasting ----------

export interface City {
  key: string;
  name: string;
}

export interface FastingWeekResponse {
  city: City & { chosen: boolean };
  today: string;
  ekadashi: { date: string; paksha: 'shukla' | 'krishna'; weekday: Weekday }[];
  ramadan: (FastTimes & { weekday: Weekday })[];
  weekDates: Record<Weekday, string>;
}

// ---------- Adaptive targets ----------

export type SuggestionStatus = 'not-enough-data' | 'on-track' | 'suggest' | 'recently-adjusted' | 'dismissed' | 'at-limit';

export interface AdjustmentSuggestion {
  status: SuggestionStatus;
  change: number | null;
  reason: string;
  trend: { kgPerWeek: number; weighIns: number; spanDays: number; latestKg: number } | null;
  currentAdjustment: number;
  quietUntil: string | null;
}

export interface AdjustmentResponse {
  suggestion: AdjustmentSuggestion;
}

// ---------- Household ----------

export interface MemberProfile extends Omit<Profile, 'cuisine'> {
  jain: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  profile: MemberProfile;
  targets: Targets;
}

export interface HouseholdResponse {
  members: HouseholdMember[];
  sharedDiet: Diet | null;
  anyJain: boolean;
  maxMembers: number;
}

// ---------- Reminders ----------

export interface ReminderSettings {
  water: { enabled: boolean; everyMinutes: 60 | 90 | 120 | 180; from: string; to: string };
  meals: { enabled: boolean; minutesBefore: 0 | 15 | 30 };
  weighIn: { enabled: boolean; time: string; days: Weekday[] };
  bedtime: { enabled: boolean; time: string };
}

export interface ReminderSettingsResponse {
  available: boolean;
  publicKey: string | null;
  timezone: string | null;
  settings: ReminderSettings;
  devices: number;
}
