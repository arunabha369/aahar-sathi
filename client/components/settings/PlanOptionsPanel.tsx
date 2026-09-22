'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Moon, RefreshCw, Save, Sparkles, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PlanBuildingOverlay, withBuildingScreen } from '@/components/plan/PlanBuildingOverlay';
import { Panel, PanelHeader } from '@/components/ui/Card';
import { OptionCard } from '@/components/ui/OptionCard';
import { SelectField } from '@/components/ui/SelectField';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { WEEKDAYS, WEEKDAY_LABELS } from '@/lib/constants';
import { formatClock, formatDate } from '@/lib/format';
import type { City, FastingMode, FastingWeekResponse, PlanPreferences, PlanResponse, Weekday } from '@/lib/types';
import { cn } from '@/lib/utils';

const MODES: { value: FastingMode; label: string; description: string; icon: typeof Sun }[] = [
  { value: 'none', label: 'No fasting', description: 'Ordinary meals, plus any weekly vrat you pick below', icon: Sun },
  { value: 'navratri', label: 'Navratri', description: 'Vrat food all week: sabudana, kuttu, samak, fruit, dairy', icon: Sparkles },
  { value: 'ekadashi', label: 'Ekadashi', description: 'Vrat food on the Ekadashi days of each plan week', icon: Leaf },
  { value: 'ramadan', label: 'Ramadan', description: 'Sehri before dawn, iftar at sunset, then dinner', icon: Moon },
];

export function PlanOptionsPanel({ initial, cities }: { initial: PlanPreferences; cities: City[] }) {
  const router = useRouter();
  const toast = useToast();
  const [prefs, setPrefs] = useState<PlanPreferences>(initial);
  const [saved, setSaved] = useState<PlanPreferences>(initial);
  const [week, setWeek] = useState<FastingWeekResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [making, startMaking] = useTransition();

  const dirty = JSON.stringify(prefs) !== JSON.stringify(saved);
  const needsCity = prefs.fasting === 'ramadan' && prefs.city === null;
  const update = (patch: Partial<PlanPreferences>) => {
    setPrefs((current) => ({ ...current, ...patch }));
    setError(null);
  };

  // A preview of what the chosen mode means this week: the Ekadashi dates or sehri/iftar times.
  const previewCity = prefs.city;
  const wantsPreview = prefs.fasting === 'ekadashi' || prefs.fasting === 'ramadan';
  useEffect(() => {
    if (!wantsPreview) return;
    let cancelled = false;
    api
      .get<FastingWeekResponse>(`/fasting/week${previewCity ? `?city=${previewCity}` : ''}`)
      .then((response) => {
        if (!cancelled) setWeek(response);
      })
      .catch(() => {
        if (!cancelled) setWeek(null);
      });
    return () => {
      cancelled = true;
    };
  }, [wantsPreview, previewCity]);

  const save = () => {
    if (needsCity) {
      setError('Choose your city so we can work out sehri and iftar times.');
      return;
    }
    startSaving(async () => {
      try {
        const response = await api.put<{ preferences: PlanPreferences }>('/profile/preferences', prefs);
        setPrefs(response.preferences);
        setSaved(response.preferences);
        toast.success('Plan options saved');
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'We could not save your options.');
      }
    });
  };

  const makePlan = () =>
    startMaking(async () => {
      try {
        await withBuildingScreen(api.post<PlanResponse>('/plans'));
        toast.success('New plan ready');
        router.push('/dashboard');
        router.refresh();
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : 'We could not make a new plan.');
      }
    });

  const toggleDay = (day: Weekday) =>
    update({
      vratDays: prefs.vratDays.includes(day)
        ? prefs.vratDays.filter((entry) => entry !== day)
        : WEEKDAYS.filter((entry) => entry === day || prefs.vratDays.includes(entry)),
    });

  const upcomingEkadashi = week?.ekadashi.filter((day) => day.date >= week.today).slice(0, 3) ?? [];
  const todayTimes = week?.ramadan[0];

  return (
    <Panel>
      <PlanBuildingOverlay show={making} />
      <PanelHeader
        eyebrow="Plan options"
        title="Fasting and Jain food"
        description="These shape every plan you make from now on. Your current plan stays as it is until you make a new one."
      />

      <Switch
        checked={prefs.jain}
        onChange={(jain) => update({ jain })}
        label="Jain food"
        description="No onion, garlic, root vegetables, honey, eggs or meat. Recipes switch to hing and dry ginger."
        className="mb-5 rounded-2xl bg-surface-2 px-4 ring-1 ring-line"
      />

      <fieldset>
        <legend className="mb-2 text-[0.8125rem] font-semibold text-ink-soft">Fasting</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {MODES.map((mode) => (
            <OptionCard
              key={mode.value}
              selected={prefs.fasting === mode.value}
              onSelect={() => update({ fasting: mode.value })}
              label={mode.label}
              description={mode.description}
              icon={<mode.icon className="size-5 text-brand-700" aria-hidden="true" />}
              compact
            />
          ))}
        </div>
      </fieldset>

      {prefs.fasting === 'none' || prefs.fasting === 'ekadashi' ? (
        <fieldset className="mt-5">
          <legend className="mb-1 text-[0.8125rem] font-semibold text-ink-soft">Weekly vrat days</legend>
          <p className="mb-2 text-xs text-muted">For a regular fast — Monday for Shiva, Tuesday for Hanuman, and so on.</p>
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

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Your city"
          value={prefs.city ?? ''}
          onChange={(event) => update({ city: event.target.value === '' ? null : event.target.value })}
          options={[{ value: '', label: 'Not set' }, ...cities.map((city) => ({ value: city.key, label: city.name }))]}
          hint="Used for sehri and iftar times, and for sunrise on Ekadashi."
          error={error && needsCity ? error : undefined}
        />
      </div>

      {prefs.fasting === 'ekadashi' && week ? (
        <div className="mt-4 rounded-2xl bg-surface-2 p-4 ring-1 ring-line" aria-live="polite">
          <p className="text-sm font-semibold text-ink">Next Ekadashi days in {week.city.name}</p>
          <ul className="mt-1.5 space-y-0.5 text-sm text-ink-soft">
            {upcomingEkadashi.map((day) => (
              <li key={day.date}>
                {formatDate(day.date)} · {day.paksha === 'shukla' ? 'Shukla' : 'Krishna'} paksha
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Worked out by the common rule (the tithi at sunrise). Some calendars, like ISKCON’s, sometimes fast a day later —
            add that day above if yours does.
          </p>
        </div>
      ) : null}

      {prefs.fasting === 'ramadan' && week && todayTimes && prefs.city ? (
        <div className="mt-4 rounded-2xl bg-surface-2 p-4 ring-1 ring-line" aria-live="polite">
          <p className="text-sm font-semibold text-ink">
            Today in {week.city.name}: sehri ends {formatClock(todayTimes.sehriEnds)}, iftar {formatClock(todayTimes.iftar)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Calculated with Fajr at 18° (the Karachi method used across India). Follow your masjid’s timetable if it
            differs. Turn Ramadan off again after Eid.
          </p>
        </div>
      ) : null}

      {error && !needsCity ? (
        <p className="mt-4 text-sm font-semibold text-chilli-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button onClick={save} pending={saving} disabled={!dirty || saving}>
          <Save className="size-4" aria-hidden="true" />
          Save options
        </Button>
        {!dirty && JSON.stringify(saved) !== JSON.stringify(initial) ? (
          <Button variant="secondary" onClick={makePlan} pending={making}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Make a new plan with these
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}
