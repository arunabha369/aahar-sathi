'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, RefreshCw, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel, PanelHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { ACTIVITY_OPTIONS, DIET_OPTIONS, GENDER_OPTIONS, GOAL_OPTIONS } from '@/lib/constants';
import type { Activity, Diet, Gender, Goal, HouseholdMember, HouseholdResponse, PlanResponse } from '@/lib/types';

interface Draft {
  name: string;
  age: string;
  gender: Gender;
  weightKg: string;
  heightCm: string;
  activity: Activity;
  goal: Goal;
  diet: Diet;
  jain: boolean;
}

const EMPTY: Draft = {
  name: '',
  age: '',
  gender: 'female',
  weightKg: '',
  heightCm: '',
  activity: 'light',
  goal: 'maintain',
  diet: 'veg',
  jain: false,
};

const draftOf = (member: HouseholdMember): Draft => ({
  name: member.name,
  age: String(member.profile.age),
  gender: member.profile.gender,
  weightKg: String(member.profile.weightKg),
  heightCm: String(member.profile.heightCm),
  activity: member.profile.activity,
  goal: member.profile.goal,
  diet: member.profile.diet,
  jain: member.profile.jain,
});

const labelOf = <T extends string>(options: { value: T; label: string }[], value: T) =>
  options.find((option) => option.value === value)?.label ?? value;

function validate(draft: Draft): Partial<Record<keyof Draft, string>> {
  const errors: Partial<Record<keyof Draft, string>> = {};
  const age = Number(draft.age);
  const weight = Number(draft.weightKg);
  const height = Number(draft.heightCm);
  if (!draft.name.trim()) errors.name = 'Give them a name.';
  if (!Number.isInteger(age) || age < 18 || age > 80) errors.age = 'Household plans are for adults aged 18 to 80.';
  if (!(weight >= 30 && weight <= 250)) errors.weightKg = 'Enter a weight between 30 and 250 kg.';
  if (!(height >= 120 && height <= 220)) errors.heightCm = 'Enter a height between 120 and 220 cm.';
  return errors;
}

export function HouseholdPanel({ initial, planHousehold }: { initial: HouseholdResponse; planHousehold: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [household, setHousehold] = useState(initial);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [making, startMaking] = useTransition();

  const errors = validate(draft);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const full = household.members.length >= household.maxMembers;
  // The active plan was made for these people; if the list has changed since, portions are stale.
  const current = household.members.map((member) => member.id).sort().join();
  const stale = current !== [...planHousehold].sort().join();

  const open = (member?: HouseholdMember) => {
    setEditing(member ? member.id : 'new');
    setDraft(member ? draftOf(member) : EMPTY);
    setShowErrors(false);
  };

  const submit = () => {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    const body = {
      name: draft.name.trim(),
      age: Number(draft.age),
      gender: draft.gender,
      weightKg: Number(draft.weightKg),
      heightCm: Number(draft.heightCm),
      activity: draft.activity,
      goal: draft.goal,
      diet: draft.diet,
      jain: draft.jain,
    };
    startTransition(async () => {
      try {
        const response =
          editing === 'new'
            ? await api.post<HouseholdResponse>('/household', body)
            : await api.put<HouseholdResponse>(`/household/${editing}`, body);
        setHousehold(response);
        setEditing(null);
        toast.success(editing === 'new' ? `${body.name} added` : 'Saved');
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : 'We could not save that.');
      }
    });
  };

  const remove = (member: HouseholdMember) =>
    startTransition(async () => {
      try {
        setHousehold(await api.delete<HouseholdResponse>(`/household/${member.id}`));
        setConfirmRemove(null);
        toast.success(`${member.name} removed`);
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : 'We could not remove them.');
      }
    });

  const makePlan = () =>
    startMaking(async () => {
      try {
        await api.post<PlanResponse>('/plans');
        toast.success('New household plan ready');
        router.push('/dashboard');
        router.refresh();
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : 'We could not make a new plan.');
      }
    });

  const errorOf = (key: keyof Draft) => (showErrors ? errors[key] : undefined);

  return (
    <Panel>
      <PanelHeader
        eyebrow="Household"
        title="Cooking for the family"
        icon={<Users className="size-[1.125rem] text-brand-700" aria-hidden="true" />}
        description="Add the adults you cook for. Everyone eats the same menu, each at their own portion, and the grocery list covers you all."
      />

      {household.members.length > 0 ? (
        <>
          <ul className="divide-y divide-line rounded-2xl bg-surface-2 ring-1 ring-line">
            {household.members.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-3 text-sm font-extrabold text-ink">
                  {member.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{member.name}</span>
                  <span className="block text-xs text-muted">
                    {member.profile.age} · {labelOf(GOAL_OPTIONS, member.profile.goal)} ·{' '}
                    {labelOf(DIET_OPTIONS, member.profile.diet)}
                    {member.profile.jain ? ' · Jain' : ''} ·{' '}
                    <span className="tabular-nums">{member.targets.calories.toLocaleString('en-IN')} kcal a day</span>
                  </span>
                </span>
                {confirmRemove === member.id ? (
                  <span className="flex gap-1.5">
                    <Button size="sm" variant="danger" onClick={() => remove(member)} pending={pending}>
                      Remove
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(null)}>
                      Keep
                    </Button>
                  </span>
                ) : (
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => open(member)}
                      aria-label={`Edit ${member.name}`}
                      className="grid size-11 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-3 hover:text-ink"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemove(member.id)}
                      aria-label={`Remove ${member.name}`}
                      className="grid size-11 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-3 hover:text-chilli-600"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {household.sharedDiet ? (
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted">
              The shared menu is <span className="font-semibold text-ink">{labelOf(DIET_OPTIONS, household.sharedDiet)}</span>
              {household.anyJain ? ' and Jain' : ''} — the strictest diet at the table.
            </p>
          ) : null}
        </>
      ) : (
        <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted ring-1 ring-line">
          Just you for now. Plans and the grocery list are for one.
        </p>
      )}

      {editing ? (
        <form
          className="mt-4 rounded-2xl bg-surface-2 p-4 ring-1 ring-line"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <h3 className="mb-3 text-sm font-bold text-ink">{editing === 'new' ? 'Add a person' : `Edit ${draft.name || 'person'}`}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={draft.name} onChange={(event) => set('name', event.target.value)} error={errorOf('name')} maxLength={40} autoComplete="off" />
            <Field label="Age" inputMode="numeric" value={draft.age} onChange={(event) => set('age', event.target.value)} error={errorOf('age')} suffix="years" />
            <SelectField label="Gender" value={draft.gender} onChange={(event) => set('gender', event.target.value as Gender)} options={GENDER_OPTIONS} />
            <SelectField label="Diet" value={draft.diet} onChange={(event) => set('diet', event.target.value as Diet)} options={DIET_OPTIONS} />
            <Field label="Weight" inputMode="decimal" value={draft.weightKg} onChange={(event) => set('weightKg', event.target.value)} error={errorOf('weightKg')} suffix="kg" />
            <Field label="Height" inputMode="numeric" value={draft.heightCm} onChange={(event) => set('heightCm', event.target.value)} error={errorOf('heightCm')} suffix="cm" />
            <SelectField label="Activity" value={draft.activity} onChange={(event) => set('activity', event.target.value as Activity)} options={ACTIVITY_OPTIONS} />
            <SelectField label="Goal" value={draft.goal} onChange={(event) => set('goal', event.target.value as Goal)} options={GOAL_OPTIONS} />
          </div>
          <Switch className="mt-2" checked={draft.jain} onChange={(jain) => set('jain', jain)} label="Eats Jain food" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" pending={pending}>
              {editing === 'new' ? 'Add to household' : 'Save'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => open()} disabled={full}>
            <UserPlus className="size-4" aria-hidden="true" />
            {full ? `Household full (${household.maxMembers})` : 'Add a person'}
          </Button>
          {stale ? (
            <Button onClick={makePlan} pending={making}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Make a new plan for everyone
            </Button>
          ) : null}
        </div>
      )}
    </Panel>
  );
}
