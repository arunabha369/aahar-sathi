import { Leaf, Moon } from 'lucide-react';
import { formatClock } from '@/lib/format';
import type { DayKind, FastTimes } from '@/lib/types';

/** What makes a fast day different, shown above its meals. */
export function FastDayNote({ kind, fastTimes, cityName }: { kind?: DayKind; fastTimes?: FastTimes; cityName?: string | null }) {
  if (kind === 'vrat') {
    return (
      <p className="mb-3 flex items-start gap-2.5 rounded-2xl bg-saffron-50 px-4 py-3 text-[0.8125rem] leading-relaxed text-saffron-800 ring-1 ring-inset ring-saffron-200">
        <Leaf className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-bold">Vrat day.</span> No grains, pulses, onion or garlic — cook with sendha namak. Vrat food is
          richer, so this day is balanced to up to 35% of calories from fat.
        </span>
      </p>
    );
  }
  if (kind === 'ramadan') {
    return (
      <p className="mb-3 flex items-start gap-2.5 rounded-2xl bg-water-50 px-4 py-3 text-[0.8125rem] leading-relaxed text-water-700 ring-1 ring-inset ring-water-200">
        <Moon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          {fastTimes ? (
            <>
              <span className="font-bold">
                Sehri ends {formatClock(fastTimes.sehriEnds)} · Iftar {formatClock(fastTimes.iftar)}
              </span>
              <span className="block">
                Calculated for {cityName ?? 'your city'} (Fajr at 18°). Your masjid’s timetable may differ by a few minutes —
                follow it.
              </span>
            </>
          ) : (
            <span className="font-bold">Ramadan day: sehri, iftar and dinner.</span>
          )}
        </span>
      </p>
    );
  }
  return null;
}
