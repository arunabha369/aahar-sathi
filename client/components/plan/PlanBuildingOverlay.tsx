'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  'Working out your calorie and protein targets',
  'Picking home-style dishes for each day',
  'Balancing protein, carbs and fat',
  'Sizing portions you can measure',
  'Adding up your grocery list',
];

/** The building part: one step at a time, long enough to read each and feel considered. */
const BUILD_MS = 3500;
const STEP_MS = BUILD_MS / STEPS.length;
/** The "ready" moment before the page moves on. */
const DONE_MS = 1100;
const DONE_EVENT = 'plan-building:done';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs a plan request behind the building screen: it waits for the request and for the
 * building steps to play through, then shows "ready" for a moment before returning. A
 * failure comes back at once, so an error is never held up.
 */
export async function withBuildingScreen<T>(request: Promise<T>): Promise<T> {
  const started = Date.now();
  const result = await request;
  await wait(Math.max(0, BUILD_MS - (Date.now() - started)));
  window.dispatchEvent(new Event(DONE_EVENT));
  await wait(DONE_MS);
  return result;
}

interface PlanBuildingOverlayProps {
  show: boolean;
  title?: string;
  doneTitle?: string;
}

/**
 * The full-screen "building your plan" moment. A modal dialog of its own, so it covers
 * everything (the plan editor included) and takes no taps meanwhile. "Ready" appears only
 * once the plan really is ready — on a slow connection the last step keeps working.
 */
export function PlanBuildingOverlay({
  show,
  title = 'Building your plan',
  doneTitle = 'Your plan is ready',
}: PlanBuildingOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (show && !dialog.open) {
      dialog.showModal();
      document.getElementById(titleId)?.focus();
    }
    if (!show && dialog.open) dialog.close();
  }, [show, titleId]);

  // Steps advance with time; the last one holds until the plan is ready.
  useEffect(() => {
    if (!show) return;
    const started = Date.now();
    const reset = window.setTimeout(() => {
      setStep(0);
      setDone(false);
    }, 0);
    const ticker = window.setInterval(() => {
      setStep(Math.min(STEPS.length - 1, Math.floor((Date.now() - started) / STEP_MS)));
    }, 100);
    const onDone = () => setDone(true);
    window.addEventListener(DONE_EVENT, onDone);
    return () => {
      window.clearTimeout(reset);
      window.clearInterval(ticker);
      window.removeEventListener(DONE_EVENT, onDone);
    };
  }, [show]);

  const progress = done ? 100 : Math.round(((step + 0.5) / STEPS.length) * 92);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      data-plan-building=""
      // Escape must not hide it: the plan is still being made.
      onCancel={(event) => event.preventDefault()}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-canvas p-0 text-ink backdrop:bg-canvas open:grid open:animate-fade open:place-items-center"
    >
      <div className="flex w-full max-w-md flex-col items-center px-6 py-8 text-center">
        <div className="relative w-full max-w-[18rem] sm:max-w-[20rem]">
          <span
            aria-hidden="true"
            className="absolute inset-[12%] rounded-full bg-accent/25 blur-3xl motion-safe:animate-glow"
          />
          <div className="relative motion-safe:animate-bob">
            <Image
              src="/images/hero-character.png"
              alt=""
              width={1024}
              height={682}
              sizes="20rem"
              className="h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
            />
          </div>
          {done ? (
            <span
              aria-hidden="true"
              className="absolute -bottom-3 left-1/2 -ml-7 grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[var(--shadow-brand)] ring-4 ring-canvas motion-safe:animate-pop"
            >
              <Check className="size-7" strokeWidth={3.5} />
            </span>
          ) : null}
        </div>

        <h2 id={titleId} tabIndex={-1} className="mt-8 text-2xl font-extrabold text-ink outline-none">
          {done ? doneTitle : title}
        </h2>
        <p className="sr-only" role="status" aria-live="polite">
          {done ? doneTitle : STEPS[step]}
        </p>

        <ol className="mt-5 w-full space-y-2.5 text-left" aria-hidden="true">
          {STEPS.map((text, index) => {
            const finished = done || index < step;
            const current = !done && index === step;
            return (
              <li
                key={text}
                className={cn(
                  'flex items-center gap-3 text-[0.875rem] transition-colors duration-300',
                  finished ? 'text-ink-soft' : current ? 'font-semibold text-ink' : 'text-muted',
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center">
                  {finished ? (
                    <span className="grid size-5 place-items-center rounded-full bg-accent text-accent-ink motion-safe:animate-pop">
                      <Check className="size-3" strokeWidth={4} />
                    </span>
                  ) : current ? (
                    <Loader2 className="size-5 text-accent motion-safe:animate-spin" />
                  ) : (
                    <span className="size-2 rounded-full bg-surface-3" />
                  )}
                </span>
                {text}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </dialog>
  );
}
