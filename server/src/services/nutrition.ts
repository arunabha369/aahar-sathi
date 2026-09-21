import {
  ACTIVITY_MULTIPLIERS,
  type Activity,
  type BmiCategory,
  type Gender,
  type Goal,
  type Profile,
  type Targets,
} from '../types.ts';

/** Calorie adjustment applied to TDEE for each goal. */
export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  loss: -500,
  maintain: 0,
  gain: 300,
};

/** Grams of protein per kg of reference weight. */
export const PROTEIN_FACTOR: Record<Goal, number> = {
  loss: 1.4,
  maintain: 1.0,
  gain: 1.6,
};

/** Never prescribe fewer calories than this, whatever the maths says. */
export const CALORIE_FLOOR: Record<Gender, number> = {
  female: 1200,
  male: 1500,
};

const FAT_SHARE_OF_CALORIES = 0.25;
const ML_PER_KG = 35;
const EXTRA_ML_FOR_HIGH_ACTIVITY = 500;
const ML_PER_GLASS = 250;
/** A healthy-BMI ceiling used to cap the protein reference weight. */
const REFERENCE_BMI = 25;

export function activityMultiplier(activity: Activity): number {
  return ACTIVITY_MULTIPLIERS[activity];
}

/** Mifflin–St Jeor. Returns full precision; round only for display. */
export function calculateBmr(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

export function calculateTdee(bmr: number, activity: Activity): number {
  return bmr * activityMultiplier(activity);
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** Asian-Indian cut-offs, applied to the value as it is displayed (1 decimal). */
export function classifyBmi(roundedBmi: number): BmiCategory {
  if (roundedBmi < 18.5) return 'Underweight';
  if (roundedBmi < 23) return 'Normal';
  if (roundedBmi < 25) return 'Overweight';
  return 'Obese';
}

/** Protein is scaled by the lower of actual weight and a BMI-25 reference weight. */
export function referenceWeight(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.min(weightKg, REFERENCE_BMI * heightM * heightM);
}

export function calculateWaterMl(weightKg: number, activity: Activity): number {
  const base = ML_PER_KG * weightKg;
  return activity === 'active' || activity === 'athlete' ? base + EXTRA_ML_FOR_HIGH_ACTIVITY : base;
}

const round = (value: number): number => Math.round(value);
const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Turns a profile into the daily targets a plan is built from.
 * Everything is computed at full precision and rounded once, at the end.
 */
export function calculateTargets(profile: Profile): Targets {
  const { age, gender, weightKg, heightCm, activity, goal } = profile;
  const notes: string[] = [];

  const bmr = calculateBmr(gender, weightKg, heightCm, age);
  const tdee = calculateTdee(bmr, activity);

  const bmi = round1(calculateBmi(weightKg, heightCm));
  const bmiCategory = classifyBmi(bmi);

  // Underweight guard: losing more weight here would do harm, so build a maintenance plan.
  let effectiveGoal: Goal = goal;
  if (bmiCategory === 'Underweight' && goal === 'loss') {
    effectiveGoal = 'maintain';
    notes.push(
      `Your BMI is ${bmi.toFixed(1)}, which is in the underweight range, so we have built a maintain-weight plan instead of a weight-loss one. Please talk to a doctor or dietitian before trying to lose more weight.`,
    );
  }

  let calories = tdee + GOAL_ADJUSTMENT[effectiveGoal];

  const floor = CALORIE_FLOOR[gender];
  if (calories < floor) {
    notes.push(
      `Your calculated target came to ${round(calories)} kcal, which is below the safe minimum of ${floor} kcal for ${gender === 'female' ? 'women' : 'men'}. We have raised it to ${floor} kcal so you still get enough nutrients — weight loss will just be a little slower.`,
    );
    calories = floor;
  }

  const proteinG = PROTEIN_FACTOR[effectiveGoal] * referenceWeight(weightKg, heightCm);
  const fatG = (calories * FAT_SHARE_OF_CALORIES) / 9;
  const carbsG = (calories - proteinG * 4 - fatG * 9) / 4;

  const waterMl = calculateWaterMl(weightKg, activity);
  const waterGlasses = Math.ceil(waterMl / ML_PER_GLASS);

  if (effectiveGoal === 'gain') {
    notes.push(
      'A surplus of 300 kcal supports steady muscle gain of roughly 0.25–0.5 kg a week when you also train with weights.',
    );
  }
  if (effectiveGoal === 'loss' && calories > floor) {
    notes.push(
      'A 500 kcal daily deficit works out to about 0.5 kg of fat loss a week, which is a pace most people can keep up.',
    );
  }

  return {
    bmr: round(bmr),
    tdee: round(tdee),
    calories: round(calories),
    protein: round(proteinG),
    carbs: round(carbsG),
    fat: round(fatG),
    waterGlasses,
    bmi,
    bmiCategory,
    notes,
  };
}

/** Litres shown next to the glass count. */
export function glassesToLitres(glasses: number): number {
  return (glasses * ML_PER_GLASS) / 1000;
}
