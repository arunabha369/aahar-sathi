'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel, PanelHeader } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ActivitySection, BodySection, GoalSection } from '@/components/forms/ProfileFields';
import { ApiError, api } from '@/lib/api/client';
import { draftFromProfile, toProfile, validateDraft, type ProfileDraft } from '@/lib/profile';
import type { PlanResponse, Profile, ProfileUpdateResponse, Targets } from '@/lib/types';

interface ProfileFormProps {
  profile: Partial<Profile>;
  currentTargets: Targets | null;
}

export function ProfileForm({ profile, currentTargets }: ProfileFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<ProfileDraft>(draftFromProfile(profile));
  const [showErrors, setShowErrors] = useState(false);
  const [newTargets, setNewTargets] = useState<Targets | null>(null);
  const [saving, startSaving] = useTransition();
  const [regenerating, startRegenerating] = useTransition();

  const errors = validateDraft(draft);
  const isValid = Object.keys(errors).length === 0;

  const update = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setNewTargets(null);
  };

  const save = () => {
    const next = toProfile(draft);
    if (!next) {
      setShowErrors(true);
      return;
    }

    startSaving(async () => {
      try {
        const response = await api.put<ProfileUpdateResponse>('/profile', next);
        setNewTargets(response.targets);
        router.refresh();
        toast.success('Profile saved');
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not save your profile.');
      }
    });
  };

  const regenerate = () => {
    startRegenerating(async () => {
      try {
        await api.post<PlanResponse>('/plans');
        toast.success('New plan generated');
        router.push('/dashboard');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not build a new plan.');
      }
    });
  };

  const targetsChanged =
    newTargets !== null &&
    (currentTargets === null ||
      newTargets.calories !== currentTargets.calories ||
      newTargets.protein !== currentTargets.protein ||
      newTargets.waterGlasses !== currentTargets.waterGlasses);

  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeader
          eyebrow="Body"
          title="Your details"
          description="Changing these updates your targets. Your current plan stays as it is until you regenerate it."
        />
        <BodySection draft={draft} errors={errors} update={update} showErrors={showErrors} />
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Activity" title="How active are you?" />
        <ActivitySection draft={draft} errors={errors} update={update} showErrors={showErrors} />
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Preferences" title="Goal, diet and cuisine" />
        <GoalSection draft={draft} errors={errors} update={update} showErrors={showErrors} />
      </Panel>

      {newTargets ? (
        <Panel className="ring-2 ring-brand-100">
          <PanelHeader eyebrow="Saved" title="Updated targets" description="Your profile now gives these numbers." />
          <ul className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Calories', value: `${newTargets.calories.toLocaleString('en-IN')} kcal` },
              { label: 'Protein', value: `${newTargets.protein} g` },
              { label: 'Water', value: `${newTargets.waterGlasses} glasses` },
              { label: 'BMI', value: `${newTargets.bmi.toFixed(1)} · ${newTargets.bmiCategory}` },
            ].map((item) => (
              <li key={item.label} className="rounded-xl bg-canvas px-4 py-3 ring-1 ring-line">
                <p className="text-[0.6875rem] font-semibold text-muted">{item.label}</p>
                <p className="mt-0.5 text-[0.9375rem] font-extrabold text-ink">{item.value}</p>
              </li>
            ))}
          </ul>
          {targetsChanged ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-brand-50 px-4 py-4 ring-1 ring-inset ring-brand-100">
              <p className="flex-1 text-sm font-semibold text-brand-800">
                Your targets changed. Build a new 7-day plan to match them?
              </p>
              <Button onClick={regenerate} pending={regenerating}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Regenerate my plan
              </Button>
            </div>
          ) : null}
        </Panel>
      ) : null}

      <div className="sticky bottom-20 z-20 lg:bottom-4">
        <div className="surface-raised flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted">
            {isValid ? 'Everything looks good.' : 'Please fix the highlighted fields before saving.'}
          </p>
          <Button onClick={save} pending={saving} disabled={!isValid} size="lg">
            <Save className="size-4" aria-hidden="true" />
            Save profile
          </Button>
        </div>
      </div>
    </div>
  );
}
