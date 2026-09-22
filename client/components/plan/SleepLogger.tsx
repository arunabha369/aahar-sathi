'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { formatDate, formatSleepDuration, sleepDuration } from '@/lib/format';
import { useLocalToday } from '@/lib/useLocalToday';
import type { SleepLog } from '@/lib/types';

interface FormState {
  error?: string;
  /** The times that produced the error — it hides as soon as either is changed. */
  times?: string;
}

interface SleepLoggerProps {
  serverToday: string;
  logs: SleepLog[];
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MIN_MINUTES = 60;
const MAX_MINUTES = 16 * 60;

/** Last night's sleep, saved against this morning's date — one entry per morning. */
export function SleepLogger({ serverToday, logs }: SleepLoggerProps) {
  const router = useRouter();
  const toast = useToast();
  const today = useLocalToday(serverToday);
  const loggedToday = logs.find((log) => log.date === today);
  const latest = logs.at(-1);

  // Start from this morning's entry, else the last night logged, else a typical night.
  const [bedtime, setBedtime] = useState(loggedToday?.bedtime ?? latest?.bedtime ?? '23:00');
  const [wakeTime, setWakeTime] = useState(loggedToday?.wakeTime ?? latest?.wakeTime ?? '07:00');
  const valid = TIME.test(bedtime) && TIME.test(wakeTime);
  const minutes = valid ? sleepDuration(bedtime, wakeTime) : null;
  const plausible = minutes !== null && minutes >= MIN_MINUTES && minutes <= MAX_MINUTES;

  const [state, formAction, pending] = useActionState(
    async (): Promise<FormState> => {
      const times = `${bedtime}-${wakeTime}`;
      if (!valid) return { error: 'Enter both times, like 23:15 and 06:45.', times };
      if (!plausible) return { error: 'That is not a night of sleep — it should be between 1 and 16 hours.', times };

      try {
        await api.put<{ log: SleepLog }>(`/logs/sleep/${today}`, { bedtime, wakeTime });
        router.refresh();
        toast.success(`Sleep saved: ${formatSleepDuration(minutes!)}`);
        return {};
      } catch (error) {
        return { error: error instanceof ApiError ? error.message : 'We could not save your sleep.', times };
      }
    },
    {},
  );

  return (
    <form action={formAction} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Went to bed"
          name="bedtime"
          type="time"
          value={bedtime}
          onChange={(event) => setBedtime(event.target.value)}
          required
        />
        <Field
          label="Woke up"
          name="wakeTime"
          type="time"
          value={wakeTime}
          onChange={(event) => setWakeTime(event.target.value)}
          error={state.times === `${bedtime}-${wakeTime}` ? state.error : undefined}
          required
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
          <Moon className="size-4 shrink-0 text-sleep" aria-hidden="true" />
          {plausible ? (
            <span>
              <span className="font-bold text-ink">{formatSleepDuration(minutes!)}</span> of sleep, saved for the
              morning of {formatDate(today)}
              {loggedToday ? ' (updates that entry)' : ''}
            </span>
          ) : (
            <span>Pick when you went to bed and when you woke up.</span>
          )}
        </p>
        <Button type="submit" pending={pending} size="lg">
          {loggedToday ? 'Update last night' : 'Log sleep'}
        </Button>
      </div>
    </form>
  );
}
