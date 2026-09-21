'use client';

import { Field } from '@/components/ui/Field';
import { OptionCard } from '@/components/ui/OptionCard';
import { HeightInput } from '@/components/forms/HeightInput';
import Image from 'next/image';
import { ActivityIcon, CuisineIcon, GenderIcon, GoalIcon } from '@/components/illustrations/OptionIcons';
import {
  ACTIVITY_OPTIONS,
  CUISINE_OPTIONS,
  DIET_OPTIONS,
  GENDER_OPTIONS,
  GOAL_OPTIONS,
} from '@/lib/constants';
import type { ProfileDraft, ProfileErrors } from '@/lib/profile';

interface SectionProps {
  draft: ProfileDraft;
  errors: ProfileErrors;
  update: <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => void;
  showErrors: boolean;
}

function FieldsetError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-2 text-[0.8125rem] font-semibold text-chilli-600">{children}</p>;
}

function Legend({ children, hint }: { children: string; hint?: string }) {
  return (
    <legend className="mb-2.5">
      <span className="block text-[0.8125rem] font-semibold text-ink-soft">{children}</span>
      {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
    </legend>
  );
}

export function BodySection({ draft, errors, update, showErrors }: SectionProps) {
  return (
    <div className="space-y-6">
      <fieldset>
        <Legend hint="The Mifflin–St Jeor formula uses a different constant for men and women.">Gender</Legend>
        <div className="grid grid-cols-1 gap-3 min-[25rem]:grid-cols-2">
          {GENDER_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              icon={<GenderIcon gender={option.value} className="size-5 text-brand-700" />}
              label={option.label}
              selected={draft.gender === option.value}
              onSelect={() => update('gender', option.value)}
              compact
            />
          ))}
        </div>
        {showErrors ? <FieldsetError>{errors.gender}</FieldsetError> : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Age"
          type="number"
          inputMode="numeric"
          min={18}
          max={80}
          value={draft.age}
          onChange={(event) => update('age', event.target.value)}
          placeholder="28"
          suffix="years"
          error={showErrors ? errors.age : undefined}
          {...(showErrors && errors.age ? {} : { hint: 'Between 18 and 80' })}
        />
        <Field
          label="Weight"
          type="number"
          inputMode="decimal"
          min={30}
          max={250}
          step="0.1"
          value={draft.weightKg}
          onChange={(event) => update('weightKg', event.target.value)}
          placeholder="70"
          suffix="kg"
          error={showErrors ? errors.weightKg : undefined}
          {...(showErrors && errors.weightKg ? {} : { hint: 'Between 30 kg and 250 kg' })}
        />
      </div>

      <HeightInput
        valueCm={draft.heightCm}
        onChange={(value) => update('heightCm', value)}
        error={showErrors ? errors.heightCm : undefined}
      />
    </div>
  );
}

export function ActivitySection({ draft, errors, update, showErrors }: SectionProps) {
  return (
    <fieldset>
      <Legend hint="We multiply your BMR by this number to estimate what you burn in a day.">
        How active is a normal week?
      </Legend>
      <div className="space-y-2.5">
        {ACTIVITY_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            icon={<ActivityIcon activity={option.value} className="size-5 text-water-700" />}
            label={option.label}
            {...(option.description ? { description: option.description } : {})}
            hint={`×${option.multiplier}`}
            tone="water"
            selected={draft.activity === option.value}
            onSelect={() => update('activity', option.value)}
          />
        ))}
      </div>
      {showErrors ? <FieldsetError>{errors.activity}</FieldsetError> : null}
    </fieldset>
  );
}

export function GoalSection({ draft, errors, update, showErrors }: SectionProps) {
  return (
    <div className="space-y-6">
      <fieldset>
        <Legend>What are you working towards?</Legend>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {GOAL_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              icon={<GoalIcon goal={option.value} className="size-5 text-saffron-700" />}
              label={option.label}
              {...(option.description ? { description: option.description } : {})}
              tone="saffron"
              selected={draft.goal === option.value}
              onSelect={() => update('goal', option.value)}
            />
          ))}
        </div>
        {showErrors ? <FieldsetError>{errors.goal}</FieldsetError> : null}
      </fieldset>

      <fieldset>
        <Legend>What do you eat?</Legend>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {DIET_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              icon={
                <span className="relative block size-full overflow-hidden rounded-xl">
                  <Image src={`/images/diet/${option.value}.webp`} alt="" fill sizes="44px" className="object-cover" />
                </span>
              }
              label={option.label}
              {...(option.description ? { description: option.description } : {})}
              selected={draft.diet === option.value}
              onSelect={() => update('diet', option.value)}
            />
          ))}
        </div>
        {showErrors ? <FieldsetError>{errors.diet}</FieldsetError> : null}
      </fieldset>

      <fieldset>
        <Legend hint="About 7 in 10 dishes come from your choice — the rest keep the week interesting.">
          Which food do you like most?
        </Legend>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {CUISINE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              icon={<CuisineIcon cuisine={option.value} className="size-5" />}
              label={option.label}
              {...(option.description ? { description: option.description } : {})}
              tone="saffron"
              selected={draft.cuisine === option.value}
              onSelect={() => update('cuisine', option.value)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
