import type { Activity, Cuisine, Diet, Gender, Goal, Profile } from '@/lib/types';

export interface ProfileDraft {
  gender: Gender | null;
  age: string;
  weightKg: string;
  heightCm: string;
  activity: Activity | null;
  goal: Goal | null;
  diet: Diet | null;
  cuisine: Cuisine;
}

export const EMPTY_DRAFT: ProfileDraft = {
  gender: null,
  age: '',
  weightKg: '',
  heightCm: '',
  activity: null,
  goal: null,
  diet: null,
  cuisine: 'mix',
};

export function draftFromProfile(profile: Partial<Profile>): ProfileDraft {
  return {
    gender: profile.gender ?? null,
    age: profile.age ? String(profile.age) : '',
    weightKg: profile.weightKg ? String(profile.weightKg) : '',
    heightCm: profile.heightCm ? String(profile.heightCm) : '',
    activity: profile.activity ?? null,
    goal: profile.goal ?? null,
    diet: profile.diet ?? null,
    cuisine: profile.cuisine ?? 'mix',
  };
}

export type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;

/** The same ranges the API enforces, so users see problems before they submit. */
export function validateDraft(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};

  if (!draft.gender) errors.gender = 'Choose one so we can use the right formula.';

  const age = Number(draft.age);
  if (!draft.age.trim()) errors.age = 'Age is required.';
  else if (!Number.isInteger(age)) errors.age = 'Enter your age in whole years.';
  else if (age < 18) errors.age = 'Aahar Sathi is built for adults aged 18 and above.';
  else if (age > 80) errors.age = 'Please enter an age of 80 or below.';

  const weight = Number(draft.weightKg);
  if (!draft.weightKg.trim()) errors.weightKg = 'Weight is required.';
  else if (Number.isNaN(weight)) errors.weightKg = 'Enter your weight in kilograms.';
  else if (weight < 30) errors.weightKg = 'Weight must be at least 30 kg.';
  else if (weight > 250) errors.weightKg = 'Weight must be 250 kg or less.';

  const height = Number(draft.heightCm);
  if (!draft.heightCm.trim()) errors.heightCm = 'Height is required.';
  else if (Number.isNaN(height)) errors.heightCm = 'Enter your height.';
  else if (height < 120) errors.heightCm = 'Height must be at least 120 cm (3 ft 11 in).';
  else if (height > 220) errors.heightCm = 'Height must be 220 cm (7 ft 3 in) or less.';

  if (!draft.activity) errors.activity = 'Pick the option closest to your week.';
  if (!draft.goal) errors.goal = 'Pick what you want to work towards.';
  if (!draft.diet) errors.diet = 'Pick what you eat.';

  return errors;
}

export function toProfile(draft: ProfileDraft): Profile | null {
  if (Object.keys(validateDraft(draft)).length > 0) return null;
  return {
    age: Number(draft.age),
    gender: draft.gender as Gender,
    weightKg: Number(draft.weightKg),
    heightCm: Number(draft.heightCm),
    activity: draft.activity as Activity,
    goal: draft.goal as Goal,
    diet: draft.diet as Diet,
    cuisine: draft.cuisine,
  };
}

export const STEP_FIELDS: (keyof ProfileDraft)[][] = [
  ['gender', 'age', 'weightKg', 'heightCm'],
  ['activity'],
  ['goal', 'diet', 'cuisine'],
];

export function stepIsValid(draft: ProfileDraft, step: number): boolean {
  const errors = validateDraft(draft);
  return (STEP_FIELDS[step] ?? []).every((field) => !errors[field]);
}
