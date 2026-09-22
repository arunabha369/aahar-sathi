'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { SLOT_META } from '@/lib/constants';
import type { NewEntry } from '@/lib/useDiary';
import type { Macros, PlanSlot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BarcodeTab } from './BarcodeTab';
import { FoodSearchTab } from './FoodSearchTab';
import { MyFoodsTab } from './MyFoodsTab';
import type { PickedFood } from './foodTypes';

const TABS = [
  { id: 'search', label: 'Search' },
  { id: 'mine', label: 'My foods' },
  { id: 'barcode', label: 'Barcode' },
] as const;
type TabId = (typeof TABS)[number]['id'];

interface AddFoodSheetProps {
  open: boolean;
  onClose: () => void;
  /** Set when the food replaces a planned meal ("Other"). */
  replacing: { slot: PlanSlot; mealName: string } | null;
  onAdd: (entry: NewEntry) => Promise<boolean>;
}

const scale = (per: Macros, by: number): Macros => ({
  kcal: Math.round(per.kcal * by),
  protein: Math.round(per.protein * by * 10) / 10,
  carbs: Math.round(per.carbs * by * 10) / 10,
  fat: Math.round(per.fat * by * 10) / 10,
});

/** How much was eaten of the picked food, with the totals as they change. */
function AmountStep({
  food,
  replacing,
  pending,
  onBack,
  onConfirm,
}: {
  food: PickedFood;
  replacing: AddFoodSheetProps['replacing'];
  pending: boolean;
  onBack: () => void;
  onConfirm: (entry: NewEntry) => void;
}) {
  const product = food.kind === 'barcode' ? food.product : null;
  const [servings, setServings] = useState(1);
  const [mode, setMode] = useState<'serving' | 'amount'>(product && !product.perServing ? 'amount' : 'serving');
  const [amount, setAmount] = useState(String(product?.servingGrams ?? 100));
  const unit = product?.liquid ? 'ml' : 'g';

  const grams = Number(amount);
  const amountValid = Number.isFinite(grams) && grams > 0 && grams <= 2000;

  let per: Macros;
  let totals: Macros;
  let name: string;
  let label: string;
  if (food.kind === 'barcode') {
    const { product: item } = food;
    name = item.brand && !item.name.toLowerCase().includes(item.brand.toLowerCase()) ? `${item.name} (${item.brand})` : item.name;
    if (mode === 'serving' && item.perServing) {
      per = item.perServing;
      label = item.servingLabel ?? '1 serving';
      totals = scale(per, servings);
    } else {
      per = item.per100!;
      label = `100 ${unit}`;
      totals = scale(per, amountValid ? grams / 100 : 0);
    }
  } else {
    per = food.per;
    name = food.name;
    label = food.servingLabel;
    totals = scale(per, servings);
  }

  const confirm = () => {
    const slot = replacing?.slot ?? null;
    if (food.kind !== 'barcode') {
      onConfirm({ source: food.kind, ref: food.ref, servings, slot });
      return;
    }
    const byAmount = mode === 'amount' || !food.product.perServing;
    onConfirm({
      source: 'barcode',
      ref: food.product.barcode,
      slot,
      name: name.slice(0, 120),
      servingLabel: label.slice(0, 60),
      servings: byAmount ? grams / 100 : servings,
      ...per,
    });
  };

  const canAdd = mode === 'amount' ? amountValid : servings > 0;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </button>
      <h3 className="mt-1 text-lg font-bold text-ink">{name}</h3>

      {product && product.perServing && product.per100 ? (
        <div className="mt-3 inline-flex rounded-lg bg-canvas p-0.5 ring-1 ring-line" role="group" aria-label="Measure by">
          {(['serving', 'amount'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={cn(
                'min-h-11 rounded-md px-4 text-xs font-bold transition-colors',
                mode === option ? 'bg-surface-3 text-ink ring-1 ring-line-strong' : 'text-muted hover:text-ink',
              )}
            >
              {option === 'serving' ? `Servings (${product.servingLabel ?? 'label'})` : `By ${unit}`}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        {mode === 'amount' && product ? (
          <Field
            label={`How much, in ${unit}`}
            name="amount"
            type="number"
            inputMode="decimal"
            min={1}
            max={2000}
            suffix={unit}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={amountValid ? undefined : `Enter an amount from 1 to 2000 ${unit}.`}
          />
        ) : (
          <div>
            <p className="mb-1.5 text-[0.8125rem] font-semibold text-ink-soft">
              Servings <span className="font-normal text-muted">(1 = {label})</span>
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setServings((value) => Math.max(0.5, value - 0.5))}
                disabled={servings <= 0.5}
                aria-label="Half a serving less"
                className="grid size-12 place-items-center rounded-xl bg-surface-2 text-ink ring-1 ring-line hover:bg-surface-3 disabled:opacity-40"
              >
                <Minus className="size-5" aria-hidden="true" />
              </button>
              <output className="min-w-16 text-center text-2xl font-extrabold text-ink tabular-nums" aria-live="polite">
                {servings}
              </output>
              <button
                type="button"
                onClick={() => setServings((value) => Math.min(10, value + 0.5))}
                disabled={servings >= 10}
                aria-label="Half a serving more"
                className="grid size-12 place-items-center rounded-xl bg-surface-2 text-ink ring-1 ring-line hover:bg-surface-3 disabled:opacity-40"
              >
                <Plus className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-surface-2 p-3 text-center">
        {[
          ['Calories', `${totals.kcal}`, 'kcal'],
          ['Protein', `${totals.protein}`, 'g'],
          ['Carbs', `${totals.carbs}`, 'g'],
          ['Fat', `${totals.fat}`, 'g'],
        ].map(([title, value, suffix]) => (
          <div key={title}>
            <dt className="text-[0.6875rem] font-semibold text-muted">{title}</dt>
            <dd className="mt-0.5 text-sm font-extrabold text-ink tabular-nums">
              {value}
              <span className="ml-0.5 text-[0.6875rem] font-bold text-muted">{suffix}</span>
            </dd>
          </div>
        ))}
      </dl>

      <Button fullWidth size="lg" className="mt-5" pending={pending} disabled={!canAdd || pending} onClick={confirm}>
        {replacing ? `Add instead of ${SLOT_META[replacing.slot].label.toLowerCase()}` : 'Add to diary'}
      </Button>
    </div>
  );
}

/**
 * The Add food sheet: search the dishes and your own foods, manage your foods, or find a
 * packaged product by barcode — then say how much. A modal <dialog>, so focus stays inside
 * and Escape closes it; a bottom sheet on phones, a centred panel on larger screens.
 */
export function AddFoodSheet({ open, onClose, replacing, onAdd }: AddFoodSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const tabsId = useId();
  const [tab, setTab] = useState<TabId>('search');
  const [picked, setPicked] = useState<PickedFood | null>(null);
  const [prefillName, setPrefillName] = useState<string | undefined>(undefined);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // React's autoFocus runs before the dialog is open, so move focus here instead.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const reset = () => {
    setPicked(null);
    setTab('search');
    setPrefillName(undefined);
  };

  const close = () => {
    reset();
    onClose();
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]!;
    setTab(next.id);
    document.getElementById(`${tabsId}-${next.id}`)?.focus();
  };

  const confirm = async (entry: NewEntry) => {
    setAdding(true);
    const ok = await onAdd(entry);
    setAdding(false);
    if (ok) close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={close}
      onClick={(event) => {
        // A click on the backdrop (the dialog box itself, outside its content) closes it.
        if (event.target === event.currentTarget) close();
      }}
      className="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-3xl border border-line bg-surface p-0 text-ink shadow-[var(--shadow-lg)] backdrop:bg-black/70 open:animate-rise sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-3 pt-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-ink">
              Add food
            </h2>
            <p className="text-sm text-muted">
              {replacing ? `Instead of ${replacing.mealName}` : 'Anything you ate that isn’t on the plan'}
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

        <div className="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4">
          {open && picked ? (
            <AmountStep food={picked} replacing={replacing} pending={adding} onBack={() => setPicked(null)} onConfirm={confirm} />
          ) : open ? (
            <>
              <div role="tablist" aria-label="Ways to find food" className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-canvas p-1 ring-1 ring-line">
                {TABS.map((item, index) => (
                  <button
                    key={item.id}
                    id={`${tabsId}-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    aria-controls={`${tabsId}-${item.id}-panel`}
                    tabIndex={tab === item.id ? 0 : -1}
                    onClick={() => setTab(item.id)}
                    onKeyDown={(event) => onTabKey(event, index)}
                    className={cn(
                      'min-h-11 rounded-lg text-sm font-bold transition-colors',
                      tab === item.id ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div role="tabpanel" id={`${tabsId}-${tab}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
                {tab === 'search' ? <FoodSearchTab onPick={setPicked} /> : null}
                {tab === 'mine' ? <MyFoodsTab onPick={setPicked} prefillName={prefillName} /> : null}
                {tab === 'barcode' ? (
                  <BarcodeTab
                    onPick={setPicked}
                    onAddOwn={(name) => {
                      setPrefillName(name || undefined);
                      setTab('mine');
                    }}
                  />
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
