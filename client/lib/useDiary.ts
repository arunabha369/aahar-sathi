'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import { sendWhenOnline } from '@/lib/online';
import type { CheckinStatus, DiaryDay, Macros, PlanSlot } from '@/lib/types';

export type NewEntry =
  | { source: 'meal'; ref: string; servings: number; slot?: PlanSlot | null }
  | { source: 'custom'; ref: string; servings: number; slot?: PlanSlot | null }
  | {
      source: 'barcode';
      ref: string;
      servings: number;
      slot?: PlanSlot | null;
      name: string;
      servingLabel: string;
      kcal: number;
      protein: number;
      carbs: number;
      fat: number;
    };

const add = (a: Macros, b: Macros, sign: 1 | -1): Macros => ({
  kcal: Math.max(0, Math.round(a.kcal + sign * b.kcal)),
  protein: Math.max(0, Math.round(a.protein + sign * b.protein)),
  carbs: Math.max(0, Math.round(a.carbs + sign * b.carbs)),
  fat: Math.max(0, Math.round(a.fat + sign * b.fat)),
});

/** The day as it will look once a check-in is saved — shown straight away. */
function withCheckin(day: DiaryDay, slot: PlanSlot, status: CheckinStatus | null): DiaryDay {
  const meal = day.planned.find((candidate) => candidate.slot === slot);
  if (!meal) return day;
  let eaten = day.eaten;
  if (meal.status === 'eaten') eaten = add(eaten, meal, -1);
  if (status === 'eaten') eaten = add(eaten, meal, 1);
  return {
    ...day,
    eaten,
    planned: day.planned.map((candidate) => (candidate.slot === slot ? { ...candidate, status } : candidate)),
  };
}

/** The day as it will look once an entry is removed — shown straight away. */
function withoutEntry(day: DiaryDay, id: string): DiaryDay {
  const entry = day.entries.find((candidate) => candidate.id === id);
  if (!entry) return day;
  const entries = day.entries.filter((candidate) => candidate.id !== id);
  // The last food standing in for a planned meal takes the swap with it (as the server does).
  const reopen = entry.slot && !entries.some((candidate) => candidate.slot === entry.slot) ? entry.slot : null;
  return {
    ...day,
    eaten: add(day.eaten, entry, -1),
    entries,
    planned: day.planned.map((meal) => (meal.slot === reopen && meal.status === 'swapped' ? { ...meal, status: null } : meal)),
  };
}

/**
 * One diary day, kept in sync with the server.
 *
 * - Check-ins and removals show immediately (optimistically); the server's answer then replaces the day,
 *   so totals, check-ins and entries can never drift apart.
 * - Changes are sent one at a time, in order, so quick taps can't land out of sequence.
 * - Nothing waits for the rest of the page: other server-rendered parts (streak, charts)
 *   refresh in the background once the queue is empty.
 * - If the browser's date isn't the day the server rendered (another timezone), the right
 *   day is fetched on mount.
 */
export function useDiary(initial: DiaryDay, date: string) {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState({ from: initial, day: initial });
  const [, startRefresh] = useTransition();
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const inFlight = useRef(0);
  // Mirrors inFlight for rendering (refs must not be read during render).
  const [saving, setSaving] = useState(false);

  // New server data (after a refresh) replaces local state — adjusted during render,
  // React's recommended way to reset state when a prop changes. Not while saving, or a
  // refresh that started earlier could briefly undo a tap.
  if (state.from !== initial && !saving) setState({ from: initial, day: initial });
  const day = state.day;
  const setDay = useCallback((next: DiaryDay | ((current: DiaryDay) => DiaryDay)) => {
    setState((current) => ({ ...current, day: typeof next === 'function' ? next(current.day) : next }));
  }, []);

  useEffect(() => {
    if (date === initial.date) return;
    let cancelled = false;
    api
      .get<DiaryDay>(`/diary/${date}`)
      .then((fresh) => {
        if (!cancelled) setDay(fresh);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [date, initial.date, setDay]);

  const send = useCallback(
    (request: () => Promise<DiaryDay>, success?: string): Promise<boolean> => {
      inFlight.current += 1;
      setSaving(true);
      const result = queue.current.then(async () => {
        try {
          // Offline, the change is held and sent as soon as there is a connection again.
          const fresh = await sendWhenOnline(request, (caught) => caught instanceof ApiError);
          // Only the last answer in a burst is shown, so the ring doesn't flicker through steps.
          if (inFlight.current === 1) setDay(fresh);
          if (success) toast.success(success);
          return true;
        } catch (error) {
          toast.error(error instanceof ApiError ? error.message : 'We could not update your diary.');
          // Put the screen back to what is really saved.
          await api.get<DiaryDay>(`/diary/${date}`).then(setDay).catch(() => undefined);
          return false;
        } finally {
          inFlight.current -= 1;
          if (inFlight.current === 0) {
            setSaving(false);
            startRefresh(() => router.refresh());
          }
        }
      });
      queue.current = result;
      return result;
    },
    [date, router, setDay, toast],
  );

  return {
    day,
    saving,
    checkIn: (slot: PlanSlot, status: 'eaten' | 'skipped') => {
      setDay((current) => withCheckin(current, slot, status));
      return send(() => api.put<DiaryDay>(`/diary/${date}/checkins/${slot}`, { status }));
    },
    clearCheckIn: (slot: PlanSlot) => {
      setDay((current) => withCheckin(current, slot, null));
      return send(() => api.delete<DiaryDay>(`/diary/${date}/checkins/${slot}`));
    },
    addEntry: (entry: NewEntry, success = 'Added to your diary') =>
      send(() => api.post<DiaryDay>(`/diary/${date}/entries`, entry), success),
    removeEntry: (id: string) => {
      setDay((current) => withoutEntry(current, id));
      return send(() => api.delete<DiaryDay>(`/diary/${date}/entries/${id}`), 'Removed');
    },
  };
}
