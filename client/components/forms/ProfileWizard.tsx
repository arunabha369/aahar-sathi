'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PlanBuildingOverlay, withBuildingScreen } from '@/components/plan/PlanBuildingOverlay';
import { Panel } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ActivitySection, BodySection, GoalSection } from '@/components/forms/ProfileFields';
import { Thali } from '@/components/illustrations/Thali';
import { ApiError, api } from '@/lib/api/client';
import {
  EMPTY_DRAFT,
  draftFromProfile,
  stepIsValid,
  toProfile,
  validateDraft,
  type ProfileDraft,
} from '@/lib/profile';
import type { PlanResponse, Profile, ProfileUpdateResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

const STEPS = [
  { title: 'Your body', hint: 'Four numbers decide what your body burns at rest.' },
  { title: 'Your activity', hint: 'Be honest — most of us sit more than we think.' },
  { title: 'Goal & food', hint: 'What you are working towards, and what you like to eat.' },
];

export function ProfileWizard({ initialProfile }: { initialProfile?: Partial<Profile> }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(
    initialProfile ? draftFromProfile(initialProfile) : EMPTY_DRAFT,
  );
  const [pending, startTransition] = useTransition();
  const [building, setBuilding] = useState(false);

  const errors = validateDraft(draft);
  const canContinue = stepIsValid(draft, step);
  const isLastStep = step === STEPS.length - 1;

  const update = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const goNext = () => {
    if (!canContinue) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const goBack = () => {
    setShowErrors(false);
    setStep((current) => Math.max(0, current - 1));
  };

  const finish = () => {
    const profile = toProfile(draft);
    if (!profile) {
      setShowErrors(true);
      return;
    }

    setBuilding(true);
    startTransition(async () => {
      try {
        await api.put<ProfileUpdateResponse>('/profile', profile);
        await withBuildingScreen(api.post<PlanResponse>('/plans'));
        router.push('/dashboard');
        router.refresh();
      } catch (error) {
        setBuilding(false);
        toast.error(
          error instanceof ApiError ? error.message : 'We could not build your plan. Please try again.',
        );
      }
    });
  };

  if (building) {
    return (
      <Panel padding="lg" className="mx-auto max-w-lg text-center">
        <div className="mx-auto w-40 motion-safe:animate-[float_3.5s_ease-in-out_infinite]">
          <Thali />
        </div>
        <h2 className="mt-6 text-xl font-extrabold text-ink">Building your 7-day plan…</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Working out your calories, picking a dish for every slot of every day and writing your grocery list.
        </p>
        <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
        </div>
      </Panel>
    );
  }

  const current = STEPS[step]!;
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <PlanBuildingOverlay show={pending} title="Building your first plan" />
      {/* Stepper */}
      <div className="mb-3 flex items-center justify-between gap-3" aria-live="polite">
        <p className="eyebrow">
          Step {step + 1} of {STEPS.length}
        </p>
        <p className="text-xs font-bold text-brand-800 tabular-nums">{progress}% complete</p>
      </div>
      <ol className="mb-7 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((item, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li key={item.title} className="flex flex-1 items-center gap-2">
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full text-[0.8125rem] font-extrabold transition-colors',
                  done && 'bg-accent text-accent-ink',
                  active && 'bg-accent text-accent-ink ring-4 ring-brand-200',
                  !done && !active && 'bg-surface-2 text-muted ring-1 ring-line',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[0.8125rem] font-semibold sm:block',
                  active ? 'text-ink' : 'text-muted',
                )}
              >
                {item.title}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn('h-0.5 flex-1 rounded-full', done ? 'bg-accent' : 'bg-line')}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <Panel padding="lg">
        <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{current.title}</h2>
        <p className="mt-1 mb-6 text-sm text-muted">{current.hint}</p>

        {step === 0 ? <BodySection draft={draft} errors={errors} update={update} showErrors={showErrors} /> : null}
        {step === 1 ? <ActivitySection draft={draft} errors={errors} update={update} showErrors={showErrors} /> : null}
        {step === 2 ? <GoalSection draft={draft} errors={errors} update={update} showErrors={showErrors} /> : null}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={goBack} type="button">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}

          {isLastStep ? (
            <Button onClick={finish} pending={pending} disabled={!canContinue} size="lg" type="button">
              <Sparkles className="size-4" aria-hidden="true" />
              Build my plan
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canContinue} size="lg" type="button">
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}
