import { Schema, model, Types } from 'mongoose';
import {
  ACTIVITIES,
  BMI_CATEGORIES,
  CUISINES,
  DIETS,
  GENDERS,
  GOALS,
  INGREDIENT_CATEGORIES,
  PLAN_SLOTS,
  REGIONS,
  type PlanDay,
  type Profile,
  type Targets,
} from '../types.js';

export interface PlanDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  inputs: Profile;
  targets: Targets;
  days: PlanDay[];
  groceryChecked: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inputsSchema = new Schema<Profile>(
  {
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: GENDERS },
    weightKg: { type: Number, required: true },
    heightCm: { type: Number, required: true },
    activity: { type: String, required: true, enum: ACTIVITIES },
    goal: { type: String, required: true, enum: GOALS },
    diet: { type: String, required: true, enum: DIETS },
    cuisine: { type: String, required: true, enum: CUISINES },
  },
  { _id: false },
);

const targetsSchema = new Schema<Targets>(
  {
    bmr: { type: Number, required: true },
    tdee: { type: Number, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    waterGlasses: { type: Number, required: true },
    bmi: { type: Number, required: true },
    bmiCategory: { type: String, required: true, enum: BMI_CATEGORIES },
    notes: { type: [String], default: [] },
  },
  { _id: false },
);

const itemSchema = new Schema(
  {
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
    food: { type: String, required: true },
  },
  { _id: false },
);

const ingredientSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, enum: INGREDIENT_CATEGORIES },
  },
  { _id: false },
);

// Meals are stored as snapshots: editing the meal database never rewrites an old plan.
const planMealSchema = new Schema(
  {
    slot: { type: String, required: true, enum: PLAN_SLOTS },
    time: { type: String, required: true },
    mealId: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    diet: { type: String, required: true, enum: DIETS },
    region: { type: String, required: true, enum: REGIONS },
    factor: { type: Number, required: true },
    items: { type: [itemSchema], required: true },
    ingredients: { type: [ingredientSchema], required: true },
    kcal: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
  },
  { _id: false },
);

const daySchema = new Schema(
  {
    day: { type: String, required: true },
    meals: { type: [planMealSchema], required: true },
    totals: {
      kcal: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fat: { type: Number, required: true },
    },
  },
  { _id: false },
);

const planSchema = new Schema<PlanDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inputs: { type: inputsSchema, required: true },
    targets: { type: targetsSchema, required: true },
    days: { type: [daySchema], required: true },
    groceryChecked: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

planSchema.index({ user: 1, isActive: 1 });
planSchema.index({ user: 1, createdAt: -1 });

export const Plan = model<PlanDoc>('Plan', planSchema);
