'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';

const STEPS = [
  'Working out your calorie and protein targets',
  'Picking home-style dishes for each day',
  'Balancing protein, carbs and fat',
  'Sizing portions you can measure',
  'Adding up your grocery list',
];

/** Long enough to see the picture and read a line, short enough not to slow anyone down. */
const MIN_VISIBLE_MS = 1200;

/**
 * Waits for a plan request, but never less than the building screen's minimum — the page
 * usually moves on as soon as it resolves, and would take the screen with it. A failure
 * still comes back at once.
 */
export async function withBuildingScreen<T>(request: Promise<T>): Promise<T> {
  const [result] = await Promise.all([request, new Promise((resolve) => setTimeout(resolve, MIN_VISIBLE_MS))]);
  return result;
}
const STEP_MS = 1400;

/**
 * The "building your plan" screen, shown while a plan is generated. It is a modal dialog of
 * its own, so it sits above everything — the plan editor included — and blocks taps until
 * the plan is ready.
 */
export function PlanBuildingOverlay({ show, title = 'Building your plan' }: { show: boolean; title?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const stepId = useId();
  const shownAt = useRef(0);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  // Appear at once; when the work finishes early, stay up for the minimum so it doesn't flash.
  useEffect(() => {
    if (show) {
      shownAt.current = Date.now();
      const timer = window.setTimeout(() => {
        setStep(0);
        setVisible(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    const timer = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [show]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (visible && !dialog.open) {
      dialog.showModal();
      document.getElementById(titleId)?.focus();
    }
    if (!visible && dialog.open) dialog.close();
  }, [visible, titleId]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), STEP_MS);
    return () => window.clearInterval(timer);
  }, [visible]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      data-plan-building=""
      aria-describedby={stepId}
      // Escape must not hide it: the plan is still being made.
      onCancel={(event) => event.preventDefault()}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-canvas/95 p-0 text-ink backdrop:bg-black/60 open:grid open:animate-fade open:place-items-center"
    >
      <div className="flex w-full max-w-md flex-col items-center px-6 text-center">
        <div className="relative w-full max-w-[22rem] motion-safe:animate-float">
          <Image
            src="/images/hero-character.png"
            alt=""
            width={1024}
            height={682}
            sizes="22rem"
            className="h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
          />
        </div>
        <h2 id={titleId} tabIndex={-1} className="mt-6 text-2xl font-extrabold text-ink outline-none">
          {title}
          <span aria-hidden="true" className="motion-safe:animate-pulse">
            …
          </span>
        </h2>
        <p id={stepId} className="mt-2 min-h-[1.5rem] text-[0.9375rem] text-muted" role="status" aria-live="polite">
          {STEPS[step]}
        </p>
        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${index <= step ? 'w-6 bg-accent' : 'w-1.5 bg-surface-3'}`}
            />
          ))}
        </div>
      </div>
    </dialog>
  );
}
