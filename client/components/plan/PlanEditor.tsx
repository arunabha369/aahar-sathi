'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PlanBuildingOverlay, withBuildingScreen } from '@/components/plan/PlanBuildingOverlay';
import { Field } from '@/components/ui/Field';
import { OptionCard } from '@/components/ui/OptionCard';
import { SelectField } from '@/components/ui/SelectField';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { DietIcon, GoalIcon } from '@/components/illustrations/OptionIcons';
import { ApiError, api } from '@/lib/api/client';
import { ACTIVITY_OPTIONS, CUISINE_OPTIONS, DIET_OPTIONS, GOAL_OPTIONS, WEEKDAYS, WEEKDAY_LABELS } from '@/lib/constants';
import type {
  Activity,
  City,
  Cuisine,
  FastingMode,
  Plan,
  PlanPreferences,
  PlanResponse,
  Profile,
  ProfileResponse,
  Targets,
  Weekday,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export type PlanEditorTarget = { kind: 'new' } | { kind: 'edit'; planId: string };

const FASTING_OPTIONS: { value: FastingMode; label: string }[] = [
  { value: 'none', label: 'No fasting' },
  { value: 'navratri', label: 'Navratri (vrat all week)' },
  { value: 'ekadashi', label: 'Ekadashi' },
  { value: 'ramadan', label: 'Ramadan (sehri and iftar)' },
];

const DEFAULTS: PlanPreferences = { jain: false, fasting: 'none', vratDays: [], city: null };

interface Loaded {
  profile: Profile;
  preferences: PlanPreferences;
  targets: Targets | null;
  /** Editing an old plan leaves the profile alone. */
  savesToProfile: boolean;
  people: number;
}

function planStart(plan: Plan): Loaded {
  const { age, gender, weightKg, heightCm, activity, goal, diet, cuisine } = plan.inputs;
  const { preferences, chosenPreferences, household } = plan.inputs;
  const profile: Profile = { age, gender, weightKg, heightCm, activity, goal, diet, cuisine };
  return {
    profile,
    preferences: chosenPreferences ?? preferences ?? DEFAULTS,
    targets: plan.targets,
    savesToProfile: plan.isActive,
    people: 1 + (household?.length ?? 0),
  };
}

interface PlanEditorProps {
  target: PlanEditorTarget;
  open: boolean;
  onClose: () => void;
}

/**
 * Change what a plan is built from — goal, diet, cuisine, activity, weight, Jain and fasting —
 * with the calorie target updating as you go. New plans become active; an edited plan is
 * rebuilt in place.
 */
export function PlanEditor({ target, open, onClose }: PlanEditorProps) {
  const router = useRouter();
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weight, setWeight] = useState('');
  const [prefs, setPrefs] = useState<PlanPreferences>(DEFAULTS);
  const [cities, setCities] = useState<City[]>([]);
  const [preview, setPreview] = useState<Targets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start at the title, not on the close button (showModal focuses the first control).
      document.getElementById(titleId)?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, titleId]);

  // Load the starting point each time the editor opens: current settings, or the plan's own.
  const editId = target.kind === 'edit' ? target.planId : null;
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async (): Promise<Loaded> => {
      if (editId) return planStart((await api.get<PlanResponse>(`/plans/${editId}`)).plan);
      const [me, household] = await Promise.all([
        api.get<ProfileResponse>('/profile'),
        api.get<{ members: unknown[] }>('/household'),
      ]);
      const { jain, fasting, vratDays, city } = me.preferences;
      return {
        profile: me.profile as Profile,
        preferences: { jain, fasting, vratDays, city },
        targets: me.targets,
        savesToProfile: true,
        people: 1 + household.members.length,
      };
    };
    Promise.all([load(), api.get<{ cities: City[] }>('/fasting/cities')])
      .then(([start, list]) => {
        if (cancelled) return;
        setLoaded(start);
        setProfile(start.profile);
        setWeight(String(start.profile.weightKg));
        setPrefs(start.preferences);
        setPreview(start.targets);
        setCities(list.cities);
        setLoadError(null);
        setError(null);
      })
      .catch((caught) => {
        if (!cancelled) setLoadError(caught instanceof ApiError ? caught.message : 'We could not load your settings.');
      });
    return () => {
      cancelled = true;
    };
  }, [open, editId]);

  const weightKg = Number(weight);
  const weightError = weight.trim() === '' || !(weightKg >= 30 && weightKg <= 250) ? 'Enter a weight between 30 and 250 kg.' : undefined;
  const cityError = prefs.fasting === 'ramadan' && prefs.city === null ? 'Choose your city for sehri and iftar times.' : undefined;
  const draft: Profile | null = profile && !weightError ? { ...profile, weightKg: Math.round(weightKg * 10) / 10 } : null;
  const draftKey = draft ? JSON.stringify(draft) : '';

  // The target as it would be, recalculated a moment after each change.
  useEffect(() => {
    if (!open || !draftKey) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      api
        .post<{ targets: Targets }>('/plans/preview', { profile: JSON.parse(draftKey) as Profile })
        .then((response) => !cancelled && setPreview(response.targets))
        .catch(() => undefined);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, draftKey]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((current) => (current ? { ...current, [key]: value } : current));
  const setPref = (patch: Partial<PlanPreferences>) => setPrefs((current) => ({ ...current, ...patch }));
  const toggleDay = (day: Weekday) =>
    setPref({
      vratDays: prefs.vratDays.includes(day)
        ? prefs.vratDays.filter((entry) => entry !== day)
        : WEEKDAYS.filter((entry) => entry === day || prefs.vratDays.includes(entry)),
    });

  const close = () => {
    if (saving) return;
    onClose();
  };

  const submit = async () => {
    if (!draft || cityError) {
      setError(weightError ?? cityError ?? 'Please check the highlighted fields.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = { profile: draft, preferences: prefs };
      if (editId) {
        await withBuildingScreen(api.put<PlanResponse>(`/plans/${editId}`, body));
        toast.success('Plan updated with a fresh week of meals');
        onClose();
        router.refresh();
      } else {
        await withBuildingScreen(api.post<PlanResponse>('/plans', body));
        toast.success('Your new plan is ready');
        onClose();
        router.push('/dashboard');
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'We could not build that plan.');
    } finally {
      setSaving(false);
    }
  };

  const before = loaded?.targets?.calories ?? null;
  const change = preview && before !== null ? preview.calories - before : 0;
  const ready = loaded !== null && profile !== null;

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={close}
        onCancel={(event) => {
          if (saving) event.preventDefault();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl border border-line bg-surface p-0 text-ink shadow-[var(--shadow-lg)] backdrop:bg-black/70 open:animate-rise sm:m-auto sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-3 pt-4">
            <div className="min-w-0">
              <h2 id={titleId} tabIndex={-1} className="text-lg font-bold text-ink outline-none">
                {editId ? 'Edit this plan' : 'Make a new plan'}
              </h2>
              <p className="text-sm text-muted">
                {editId
                  ? 'Change anything below and the plan is rebuilt with a fresh week of meals.'
                  : 'Check your details and options — change anything, or keep them for a fresh week of meals.'}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-y-auto px-5 pb-5 pt-4">
            {loadError ? (
              <p className="text-sm font-semibold text-chilli-600" role="alert">
                {loadError}
              </p>
            ) : !ready ? (
              <div className="space-y-3" aria-hidden="true">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl bg-surface-2 p-4 ring-1 ring-line" aria-live="polite">
                  <p className="text-xs font-semibold text-muted">Daily target</p>
                  <p className="mt-0.5 text-2xl font-extrabold text-ink tabular-nums">
                    {preview ? preview.calories.toLocaleString('en-IN') : '—'} kcal
                    {change !== 0 ? (
                      <span className={cn('ml-2 text-sm font-bold', change > 0 ? 'text-saffron-700' : 'text-brand-800')}>
                        {change > 0 ? '+' : '−'}
                        {Math.abs(change).toLocaleString('en-IN')} from now
                      </span>
                    ) : null}
                  </p>
                  {preview ? (
                    <p className="mt-0.5 text-[0.8125rem] text-muted tabular-nums">
                      Protein {preview.protein} g · Carbs {preview.carbs} g · Fat {preview.fat} g · BMI {preview.bmi.toFixed(1)}
                    </p>
                  ) : null}
                </div>

                <fieldset>
                  <legend className="mb-2 text-[0.8125rem] font-semibold text-ink-soft">Goal</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {GOAL_OPTIONS.map((option) => (
                      <OptionCard
                        key={option.value}
                        compact
                        selected={profile.goal === option.value}
                        onSelect={() => set('goal', option.value)}
                        label={option.label}
                        icon={<GoalIcon goal={option.value} className="size-5 text-saffron-700" />}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-[0.8125rem] font-semibold text-ink-soft">Diet</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {DIET_OPTIONS.map((option) => (
                      <OptionCard
                        key={option.value}
                        compact
                        selected={profile.diet === option.value}
                        onSelect={() => set('diet', option.value)}
                        label={option.label}
                        icon={<DietIcon diet={option.value} className="size-5" />}
                      />
                    ))}
                  </div>
                  {loaded.people > 1 ? (
                    <p className="mt-2 text-xs text-muted">
                      You cook for {loaded.people} people: the shared menu follows the strictest diet at the table.
                    </p>
                  ) : null}
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField
                    label="Cuisine"
                    value={profile.cuisine}
                    onChange={(event) => set('cuisine', event.target.value as Cuisine)}
                    options={CUISINE_OPTIONS}
                  />
                  <SelectField
                    label="Activity"
                    value={profile.activity}
                    onChange={(event) => set('activity', event.target.value as Activity)}
                    options={ACTIVITY_OPTIONS}
                  />
                  <Field
                    label="Weight today"
                    inputMode="decimal"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    error={weightError}
                    suffix="kg"
                  />
                </div>

                <div className="border-t border-line pt-5">
                  <Switch
                    checked={prefs.jain}
                    onChange={(jain) => setPref({ jain })}
                    label="Jain food"
                    description="No onion, garlic, root vegetables, eggs or meat"
                  />
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Fasting"
                      value={prefs.fasting}
                      onChange={(event) => setPref({ fasting: event.target.value as FastingMode })}
                      options={FASTING_OPTIONS}
                    />
                    {prefs.fasting === 'ramadan' || prefs.fasting === 'ekadashi' ? (
                      <SelectField
                        label="Your city"
                        value={prefs.city ?? ''}
                        onChange={(event) => setPref({ city: event.target.value === '' ? null : event.target.value })}
                        options={[{ value: '', label: 'Not set' }, ...cities.map((city) => ({ value: city.key, label: city.name }))]}
                        error={cityError}
                      />
                    ) : null}
                  </div>
                  {prefs.fasting === 'none' || prefs.fasting === 'ekadashi' ? (
                    <fieldset className="mt-4">
                      <legend className="mb-1.5 text-[0.8125rem] font-semibold text-ink-soft">Weekly vrat days</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {WEEKDAYS.map((day) => (
                          <button
                            key={day}
                            type="button"
                            aria-pressed={prefs.vratDays.includes(day)}
                            aria-label={WEEKDAY_LABELS[day]}
                            onClick={() => toggleDay(day)}
                            className={cn(
                              'min-h-11 min-w-12 rounded-xl px-3 text-[0.8125rem] font-bold transition-colors',
                              prefs.vratDays.includes(day)
                                ? 'bg-accent text-accent-ink'
                                : 'bg-surface-2 text-ink-soft ring-1 ring-line hover:bg-surface-3 hover:text-ink',
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                </div>

                <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs leading-relaxed text-muted ring-1 ring-line">
                  {editId
                    ? loaded.savesToProfile
                      ? 'This is your active plan, so these become your settings too. Meals you swapped are replaced by the new week.'
                      : 'Only this saved plan changes — your profile and active plan stay as they are.'
                    : 'These become your settings, and the new plan becomes your active one. Your current plan stays in your history.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
            {error ? (
              <p className="mr-auto text-sm font-semibold text-chilli-600" role="alert">
                {error}
              </p>
            ) : null}
            <Button variant="ghost" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} pending={saving} disabled={!ready || saving}>
              {editId ? <Pencil className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              {saving ? 'Building…' : editId ? 'Save and rebuild' : 'Make my plan'}
            </Button>
          </div>
        </div>
      </dialog>
      <PlanBuildingOverlay
        show={saving}
        title={editId ? 'Rebuilding your plan' : 'Building your plan'}
        doneTitle={editId ? 'Your plan is updated' : 'Your plan is ready'}
      />
    </>
  );
}

/** A button that opens the editor: "New plan" or "Edit". */
export function PlanEditorButton({
  target,
  label,
  variant = target.kind === 'new' ? 'primary' : 'secondary',
  size = 'md',
  className,
}: {
  target: PlanEditorTarget;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} className={className}>
        {target.kind === 'new' ? <Sparkles className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
        {label ?? (target.kind === 'new' ? 'New plan' : 'Edit')}
      </Button>
      <PlanEditor target={target} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
