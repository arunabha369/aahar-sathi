'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel, PanelHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { WEEKDAYS, WEEKDAY_LABELS } from '@/lib/constants';
import {
  PermissionDeniedError,
  currentSubscription,
  pushSupport,
  subscribe,
  subscriptionBody,
  type PushSupport,
} from '@/lib/push';
import type { ReminderSettings, ReminderSettingsResponse, Weekday } from '@/lib/types';
import { cn } from '@/lib/utils';

type DeviceState = 'checking' | 'on' | 'off' | 'blocked' | PushSupport;

const WATER_EVERY = [
  { value: '60', label: 'Every hour' },
  { value: '90', label: 'Every 1½ hours' },
  { value: '120', label: 'Every 2 hours' },
  { value: '180', label: 'Every 3 hours' },
];
const MEAL_LEAD = [
  { value: '0', label: 'At meal time' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
];

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function RemindersPanel({ initial }: { initial: ReminderSettingsResponse }) {
  const toast = useToast();
  const [settings, setSettings] = useState<ReminderSettings>(initial.settings);
  const [saved, setSaved] = useState(JSON.stringify(initial.settings));
  const [device, setDevice] = useState<DeviceState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const support = pushSupport();
    if (support !== 'supported') {
      queueMicrotask(() => !cancelled && setDevice(support));
      return;
    }
    currentSubscription()
      .then((subscription) => {
        if (cancelled) return;
        if (subscription) setDevice('on');
        else setDevice(Notification.permission === 'denied' ? 'blocked' : 'off');
      })
      .catch(() => !cancelled && setDevice('off'));
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof ReminderSettings>(key: K, patch: Partial<ReminderSettings[K]>) =>
    setSettings((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  const dirty = JSON.stringify(settings) !== saved;
  const waterInvalid = settings.water.enabled && settings.water.from >= settings.water.to;
  const weighInvalid = settings.weighIn.enabled && settings.weighIn.days.length === 0;

  const saveSettings = async () => {
    await api.put('/reminders/settings', { timezone: timezone(), ...settings });
    setSaved(JSON.stringify(settings));
  };

  const turnOn = () =>
    startTransition(async () => {
      setError(null);
      try {
        const subscription = await subscribe(initial.publicKey!);
        await api.post('/reminders/subscriptions', subscriptionBody(subscription));
        await saveSettings();
        setDevice('on');
        toast.success('Reminders are on for this device');
      } catch (caught) {
        if (caught instanceof PermissionDeniedError) {
          setDevice('blocked');
          setError('Notifications are blocked for this site. Allow them in your browser’s site settings, then try again.');
        } else {
          setError(caught instanceof ApiError ? caught.message : 'We could not turn reminders on in this browser.');
        }
      }
    });

  const turnOff = () =>
    startTransition(async () => {
      setError(null);
      try {
        const subscription = await currentSubscription();
        if (subscription) {
          await api.delete('/reminders/subscriptions', { endpoint: subscription.endpoint });
          await subscription.unsubscribe();
        }
        setDevice('off');
        toast.success('Reminders are off for this device');
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'We could not turn reminders off.');
      }
    });

  const save = () =>
    startTransition(async () => {
      setError(null);
      try {
        await saveSettings();
        toast.success('Reminder times saved');
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'We could not save your reminders.');
      }
    });

  const test = () =>
    startTransition(async () => {
      try {
        await api.post('/reminders/test');
        toast.success('Test sent — it should appear in a few seconds');
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : 'We could not send a test.');
      }
    });

  const toggleDay = (day: Weekday) =>
    set('weighIn', {
      days: settings.weighIn.days.includes(day)
        ? settings.weighIn.days.filter((entry) => entry !== day)
        : WEEKDAYS.filter((entry) => entry === day || settings.weighIn.days.includes(entry)),
    });

  if (!initial.available) {
    return (
      <Panel>
        <PanelHeader eyebrow="Reminders" title="Reminders" icon={<Bell className="size-[1.125rem] text-brand-700" aria-hidden="true" />} />
        <p className="text-sm text-muted">Reminders are not switched on for this server yet.</p>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        eyebrow="Reminders"
        title="Nudges that help"
        icon={<Bell className="size-[1.125rem] text-brand-700" aria-hidden="true" />}
        description="Water, meal times, weigh-ins and bedtime, sent to this phone or computer. Nothing is sent once it’s done — no water nudges after your last glass, no meal nudge after you check in."
      />

      <div className="mb-5 rounded-2xl bg-surface-2 p-4 ring-1 ring-line" aria-live="polite">
        {device === 'checking' ? (
          <p className="text-sm text-muted">Checking this device…</p>
        ) : device === 'on' ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              <span className="mr-2 inline-block size-2 rounded-full bg-accent align-middle" aria-hidden="true" />
              On for this device
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={test} pending={pending}>
                <Send className="size-4" aria-hidden="true" />
                Send a test
              </Button>
              <Button size="sm" variant="ghost" onClick={turnOff} disabled={pending}>
                <BellOff className="size-4" aria-hidden="true" />
                Turn off here
              </Button>
            </div>
          </div>
        ) : device === 'ios-needs-install' ? (
          <p className="text-sm text-ink-soft">
            On iPhone and iPad, reminders work once Aahar Sathi is on your Home Screen: tap Share, then “Add to Home Screen”,
            and open it from there (iOS 16.4 or later).
          </p>
        ) : device === 'unsupported' ? (
          <p className="text-sm text-ink-soft">This browser can’t show reminders. Try Chrome, Edge, Firefox or Safari.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              {device === 'blocked' ? 'Notifications are blocked for this site in your browser.' : 'Off for this device.'}
            </p>
            <Button size="sm" onClick={turnOn} pending={pending} disabled={waterInvalid || weighInvalid}>
              <Bell className="size-4" aria-hidden="true" />
              Turn on reminders
            </Button>
          </div>
        )}
      </div>

      <div className="divide-y divide-line">
        <section className="pb-4">
          <Switch checked={settings.water.enabled} onChange={(enabled) => set('water', { enabled })} label="Water" description="Through the day until you reach your glasses." />
          {settings.water.enabled ? (
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <SelectField label="How often" value={String(settings.water.everyMinutes)} onChange={(event) => set('water', { everyMinutes: Number(event.target.value) as ReminderSettings['water']['everyMinutes'] })} options={WATER_EVERY} />
              <Field label="From" type="time" value={settings.water.from} onChange={(event) => set('water', { from: event.target.value })} />
              <Field label="Until" type="time" value={settings.water.to} onChange={(event) => set('water', { to: event.target.value })} error={waterInvalid ? 'Pick a time after the start.' : undefined} />
            </div>
          ) : null}
        </section>

        <section className="py-4">
          <Switch checked={settings.meals.enabled} onChange={(enabled) => set('meals', { enabled })} label="Meal times" description="From your plan, with the dish — including sehri and iftar in Ramadan." />
          {settings.meals.enabled ? (
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <SelectField label="When" value={String(settings.meals.minutesBefore)} onChange={(event) => set('meals', { minutesBefore: Number(event.target.value) as ReminderSettings['meals']['minutesBefore'] })} options={MEAL_LEAD} />
            </div>
          ) : null}
        </section>

        <section className="py-4">
          <Switch checked={settings.weighIn.enabled} onChange={(enabled) => set('weighIn', { enabled })} label="Weigh-in" description="Same time each week keeps the trend honest." />
          {settings.weighIn.enabled ? (
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <Field label="At" type="time" value={settings.weighIn.time} onChange={(event) => set('weighIn', { time: event.target.value })} />
              <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 text-[0.8125rem] font-semibold text-ink-soft">On</legend>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={settings.weighIn.days.includes(day)}
                      aria-label={WEEKDAY_LABELS[day]}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        'min-h-11 min-w-11 rounded-xl px-2.5 text-[0.8125rem] font-bold transition-colors',
                        settings.weighIn.days.includes(day)
                          ? 'bg-accent text-accent-ink'
                          : 'bg-surface-2 text-ink-soft ring-1 ring-line hover:bg-surface-3 hover:text-ink',
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {weighInvalid ? <p className="mt-1.5 text-[0.8125rem] font-semibold text-chilli-600">Pick at least one day.</p> : null}
              </fieldset>
            </div>
          ) : null}
        </section>

        <section className="pt-4">
          <Switch checked={settings.bedtime.enabled} onChange={(enabled) => set('bedtime', { enabled })} label="Bedtime" description="A nudge to wind down." />
          {settings.bedtime.enabled ? (
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <Field label="At" type="time" value={settings.bedtime.time} onChange={(event) => set('bedtime', { time: event.target.value })} />
            </div>
          ) : null}
        </section>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-semibold text-chilli-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={save} pending={pending} disabled={!dirty || waterInvalid || weighInvalid || pending}>
          <Save className="size-4" aria-hidden="true" />
          Save reminder times
        </Button>
        <p className="text-xs text-muted">Times follow this device’s timezone ({initial.timezone ?? 'set when you save'}).</p>
      </div>
    </Panel>
  );
}
