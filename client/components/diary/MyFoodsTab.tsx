'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ApiError, api } from '@/lib/api/client';
import type { CustomFood } from '@/lib/types';
import type { PickedFood } from './foodTypes';

interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

const NUMBER_FIELDS = [
  { name: 'kcal', label: 'Calories', unit: 'kcal', max: 5000 },
  { name: 'protein', label: 'Protein', unit: 'g', max: 500 },
  { name: 'carbs', label: 'Carbs', unit: 'g', max: 500 },
  { name: 'fat', label: 'Fat', unit: 'g', max: 500 },
] as const;

/** The user's own dishes: pick one to log, remove one, or save a new one. */
export function MyFoodsTab({ onPick, prefillName }: { onPick: (food: PickedFood) => void; prefillName?: string }) {
  const [foods, setFoods] = useState<CustomFood[] | null>(null);
  const [creating, setCreating] = useState(Boolean(prefillName));
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ foods: CustomFood[] }>('/foods/custom')
      .then(({ foods: list }) => {
        if (!cancelled) setFoods(list);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Your foods could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pick = (food: CustomFood) =>
    onPick({ kind: 'custom', ref: food.id, name: food.name, servingLabel: food.servingLabel, per: food });

  const [state, formAction, pending] = useActionState(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const values = Object.fromEntries(
        ['name', 'servingLabel', ...NUMBER_FIELDS.map((field) => field.name)].map((key) => [key, String(formData.get(key) ?? '').trim()]),
      );
      const fieldErrors: Record<string, string> = {};
      if (!values.name) fieldErrors.name = 'Give the dish a name.';
      if (!values.servingLabel) fieldErrors.servingLabel = 'Say what one serving is, e.g. “1 bowl”.';
      for (const field of NUMBER_FIELDS) {
        const value = Number(values[field.name]);
        if (values[field.name] === '' || !Number.isFinite(value) || value < 0 || value > field.max) {
          fieldErrors[field.name] = `Enter ${field.label.toLowerCase()} from 0 to ${field.max}.`;
        }
      }
      if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

      try {
        const { food } = await api.post<{ food: CustomFood }>('/foods/custom', {
          name: values.name,
          servingLabel: values.servingLabel,
          ...Object.fromEntries(NUMBER_FIELDS.map((field) => [field.name, Number(values[field.name])])),
        });
        setFoods((current) => [...(current ?? []), food].sort((a, b) => a.name.localeCompare(b.name)));
        setCreating(false);
        pick(food);
        return {};
      } catch (error) {
        const fieldErrors = error instanceof ApiError ? Object.fromEntries((error.details ?? []).map((detail) => [detail.field, detail.message])) : {};
        return {
          error: error instanceof ApiError ? error.message : 'We could not save that food.',
          fieldErrors,
          values,
        };
      }
    },
    {},
  );

  const remove = async (food: CustomFood) => {
    await api.delete(`/foods/custom/${food.id}`).catch(() => undefined);
    setFoods((current) => current?.filter((item) => item.id !== food.id) ?? null);
  };

  if (creating) {
    return (
      <form action={formAction} className="space-y-3" noValidate>
        <p className="text-sm text-muted">Numbers for one serving — the label on a pack, or your best estimate.</p>
        {state.error && !Object.keys(state.fieldErrors ?? {}).length ? (
          <p role="alert" className="rounded-xl bg-chilli-50 px-3 py-2 text-sm font-semibold text-chilli-700 ring-1 ring-inset ring-chilli-200">
            {state.error}
          </p>
        ) : null}
        <Field label="Name" name="name" defaultValue={state.values?.name ?? prefillName} placeholder="Maa’s rajma" required error={state.fieldErrors?.name} />
        <Field label="One serving is" name="servingLabel" defaultValue={state.values?.servingLabel} placeholder="1 bowl" required error={state.fieldErrors?.servingLabel} />
        <div className="grid grid-cols-2 gap-3">
          {NUMBER_FIELDS.map((field) => (
            <Field
              key={field.name}
              label={field.label}
              name={field.name}
              type="number"
              inputMode="decimal"
              min={0}
              max={field.max}
              step="0.1"
              suffix={field.unit}
              defaultValue={state.values?.[field.name]}
              required
              error={state.fieldErrors?.[field.name]}
            />
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
            Cancel
          </Button>
          <Button type="submit" pending={pending} className="flex-1">
            Save food
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <Button variant="secondary" fullWidth onClick={() => setCreating(true)}>
        <Plus className="size-4" aria-hidden="true" />
        New food
      </Button>

      <div className="mt-3">
        {loadError ? <p className="px-1 text-sm font-semibold text-chilli-700">{loadError}</p> : null}
        {foods === null && !loadError ? <p className="px-1 text-sm text-muted">Loading your foods…</p> : null}
        {foods?.length === 0 ? (
          <p className="px-1 text-sm text-muted">Save the dishes you eat often — home recipes, a favourite dhaba order — and log them in a tap.</p>
        ) : null}
        <ul className="space-y-1">
          {foods?.map((food) => (
            <li key={food.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => pick(food)}
                className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
              >
                <span className="min-w-0 text-sm font-semibold text-ink">{food.name}</span>
                <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">
                  {Math.round(food.kcal)} kcal · {food.servingLabel}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(food)}
                aria-label={`Remove ${food.name} from your foods`}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-chilli-600"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
