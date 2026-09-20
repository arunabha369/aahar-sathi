'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { useLocalToday } from '@/lib/useLocalToday';
import type { WeightLog } from '@/lib/types';

interface FormState {
  error?: string;
}

interface WeightLoggerProps {
  serverToday: string;
  logs: WeightLog[];
}

export function WeightLogger({ serverToday, logs }: WeightLoggerProps) {
  const router = useRouter();
  const toast = useToast();
  const today = useLocalToday(serverToday);
  const loggedToday = logs.find((log) => log.date === today);
  const latest = logs.at(-1);

  const [state, formAction, pending] = useActionState(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const weightKg = Number(formData.get('weightKg'));

      if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 250) {
        return { error: 'Enter a weight between 30 kg and 250 kg.' };
      }

      try {
        await api.put<{ log: WeightLog }>(`/logs/weight/${today}`, { weightKg });
        router.refresh();
        toast.success('Weight saved for today ⚖️');
        return {};
      } catch (error) {
        return {
          error: error instanceof ApiError ? error.message : 'We could not save your weight.',
        };
      }
    },
    {},
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3" noValidate>
      <div className="min-w-40 flex-1">
        <Field
          label={`Weight for ${formatDate(today)}`}
          name="weightKg"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={30}
          max={250}
          defaultValue={loggedToday?.weightKg ?? latest?.weightKg ?? ''}
          suffix="kg"
          error={state.error}
          {...(state.error ? {} : { hint: loggedToday ? 'Saving again will update today’s entry.' : 'One entry per day.' })}
        />
      </div>
      <Button type="submit" pending={pending} size="lg" className="mb-0.5">
        {loggedToday ? 'Update today' : 'Log weight'}
      </Button>
    </form>
  );
}
