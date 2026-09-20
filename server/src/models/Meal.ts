import { Schema, model, Types } from 'mongoose';
import {
  DIETS,
  INGREDIENT_CATEGORIES,
  MEAL_SLOTS,
  REGIONS,
  type MealData,
} from '../types.js';

export interface MealDoc extends MealData {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema(
  {
    qty: { type: Number, required: true, min: 0 },
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

const mealSchema = new Schema<MealDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slot: { type: String, required: true, enum: MEAL_SLOTS, index: true },
    diet: { type: String, required: true, enum: DIETS, index: true },
    region: { type: String, required: true, enum: REGIONS },
    items: { type: [itemSchema], required: true },
    kcal: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    ingredients: { type: [ingredientSchema], required: true },
  },
  { timestamps: true },
);

export const Meal = model<MealDoc>('Meal', mealSchema);
