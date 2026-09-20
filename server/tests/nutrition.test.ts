import { describe, expect, it } from 'vitest';
import {
  calculateBmi,
  calculateBmr,
  calculateTargets,
  calculateTdee,
  classifyBmi,
  glassesToLitres,
  referenceWeight,
} from '../src/services/nutrition.js';
import type { Profile } from '../src/types.js';

const base: Profile = {
  age: 25,
  gender: 'male',
  weightKg: 70,
  heightCm: 175,
  activity: 'moderate',
  goal: 'loss',
  diet: 'veg',
  cuisine: 'mix',
};

describe('calculateTargets — worked examples', () => {
  it('male, 25, 70 kg, 175 cm, moderate, weight loss', () => {
    const targets = calculateTargets(base);

    expect(targets.bmr).toBe(1674);
    expect(targets.tdee).toBe(2594);
    expect(targets.calories).toBe(2094);
    expect(targets.bmi).toBe(22.9);
    expect(targets.bmiCategory).toBe('Normal');
    expect(targets.protein).toBe(98);
    expect(targets.fat).toBe(58);
    expect(targets.carbs).toBe(295);
    expect(targets.waterGlasses).toBe(10);
    expect(glassesToLitres(targets.waterGlasses)).toBe(2.5);
  });

  it('female, 30, 55 kg, 160 cm, sedentary, weight loss — raised to the 1200 kcal floor', () => {
    const targets = calculateTargets({
      ...base,
      age: 30,
      gender: 'female',
      weightKg: 55,
      heightCm: 160,
      activity: 'sedentary',
    });

    expect(targets.bmr).toBe(1239);
    expect(targets.tdee).toBe(1487);
    expect(targets.calories).toBe(1200);
    expect(targets.bmi).toBe(21.5);
    expect(targets.bmiCategory).toBe('Normal');
    expect(targets.protein).toBe(77);
    expect(targets.fat).toBe(33);
    expect(targets.carbs).toBe(148);
    expect(targets.waterGlasses).toBe(8);
    expect(glassesToLitres(targets.waterGlasses)).toBe(2);
    expect(targets.notes.join(' ')).toContain('987 kcal');
    expect(targets.notes.join(' ')).toContain('1200 kcal');
  });

  it('female, 22, 42 kg, 160 cm, light, weight loss — underweight guard builds a maintain plan', () => {
    const targets = calculateTargets({
      ...base,
      age: 22,
      gender: 'female',
      weightKg: 42,
      heightCm: 160,
      activity: 'light',
    });

    expect(targets.bmi).toBe(16.4);
    expect(targets.bmiCategory).toBe('Underweight');
    expect(targets.calories).toBe(1580);
    expect(targets.tdee).toBe(1580);
    expect(targets.protein).toBe(42);
    expect(targets.notes.some((note) => note.includes('underweight'))).toBe(true);
  });
});

describe('BMR and TDEE', () => {
  it('uses Mifflin–St Jeor for each gender', () => {
    expect(calculateBmr('male', 70, 175, 25)).toBeCloseTo(1673.75, 5);
    expect(calculateBmr('female', 55, 160, 30)).toBeCloseTo(1239, 5);
  });

  it('applies the activity multipliers', () => {
    expect(calculateTdee(1000, 'sedentary')).toBeCloseTo(1200, 5);
    expect(calculateTdee(1000, 'light')).toBeCloseTo(1375, 5);
    expect(calculateTdee(1000, 'moderate')).toBeCloseTo(1550, 5);
    expect(calculateTdee(1000, 'active')).toBeCloseTo(1725, 5);
    expect(calculateTdee(1000, 'athlete')).toBeCloseTo(1900, 5);
  });
});

describe('BMI classification (Asian-Indian cut-offs)', () => {
  it('classifies the rounded value', () => {
    expect(classifyBmi(18.4)).toBe('Underweight');
    expect(classifyBmi(18.5)).toBe('Normal');
    expect(classifyBmi(22.9)).toBe('Normal');
    expect(classifyBmi(23)).toBe('Overweight');
    expect(classifyBmi(24.9)).toBe('Overweight');
    expect(classifyBmi(25)).toBe('Obese');
    expect(classifyBmi(31.2)).toBe('Obese');
  });

  it('rounds BMI to one decimal', () => {
    expect(Math.round(calculateBmi(70, 175) * 10) / 10).toBe(22.9);
    expect(Math.round(calculateBmi(42, 160) * 10) / 10).toBe(16.4);
  });
});

describe('protein reference weight', () => {
  it('caps protein for someone well above a BMI of 25', () => {
    // 170 cm → BMI-25 weight is 72.25 kg, so a 110 kg user is scaled to that.
    expect(referenceWeight(110, 170)).toBeCloseTo(72.25, 5);
    expect(calculateTargets({ ...base, weightKg: 110, heightCm: 170 }).protein).toBe(101);
  });

  it('uses actual weight when it is below the reference', () => {
    expect(referenceWeight(60, 175)).toBe(60);
  });
});

describe('water target', () => {
  it('adds 500 ml for active and athlete profiles', () => {
    expect(calculateTargets({ ...base, activity: 'moderate' }).waterGlasses).toBe(10);
    expect(calculateTargets({ ...base, activity: 'active' }).waterGlasses).toBe(12);
    expect(calculateTargets({ ...base, activity: 'athlete' }).waterGlasses).toBe(12);
  });
});

describe('goal adjustments and the calorie floor', () => {
  it('adds 300 kcal for muscle gain and leaves maintain alone', () => {
    const maintain = calculateTargets({ ...base, goal: 'maintain' });
    const gain = calculateTargets({ ...base, goal: 'gain' });

    expect(maintain.calories).toBe(2594);
    expect(gain.calories).toBe(2894);
    expect(gain.protein).toBe(112);
  });

  it('never goes below 1500 kcal for men', () => {
    const targets = calculateTargets({
      ...base,
      age: 60,
      weightKg: 55,
      heightCm: 165,
      activity: 'sedentary',
    });

    expect(targets.calories).toBe(1500);
    expect(targets.notes.join(' ')).toContain('1500 kcal');
  });

  it('keeps macros consistent with the calorie target', () => {
    for (const goal of ['loss', 'maintain', 'gain'] as const) {
      const targets = calculateTargets({ ...base, goal });
      const fromMacros = targets.protein * 4 + targets.carbs * 4 + targets.fat * 9;
      expect(Math.abs(fromMacros - targets.calories)).toBeLessThanOrEqual(6);
      // Fat sits at a quarter of the day's calories.
      expect(targets.fat * 9).toBeCloseTo(targets.calories * 0.25, -1);
    }
  });
});
