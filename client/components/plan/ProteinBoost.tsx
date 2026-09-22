import { Beef } from 'lucide-react';
import { PROTEIN_BOOSTERS } from '@/lib/constants';
import type { Diet } from '@/lib/types';

interface ProteinBoostProps {
  dayProtein: number;
  targetProtein: number;
  diet: Diet;
  /** Fast days: only suggest what a vrat allows. */
  vrat?: boolean;
}

/** Shown when a day lands under 85% of the protein target. */
export function ProteinBoost({ dayProtein, targetProtein, diet, vrat = false }: ProteinBoostProps) {
  if (dayProtein >= targetProtein * 0.85) return null;

  const gap = Math.max(1, Math.round(targetProtein - dayProtein));
  const suggestions = PROTEIN_BOOSTERS.filter((booster) => booster.diets.includes(diet) && (!vrat || booster.vrat))
    .sort((a, b) => Math.abs(a.protein - gap) - Math.abs(b.protein - gap))
    .slice(0, 2);

  return (
    <div className="flex gap-3 rounded-2xl bg-saffron-50 p-4 ring-1 ring-inset ring-saffron-200">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-saffron-100 text-saffron-700">
        <Beef className="size-[1.125rem]" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-bold text-saffron-800">Protein boost</p>
        <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-saffron-800/90">
          This day is about {gap} g short of your {targetProtein} g target. Add one of these:
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.label}
              className="rounded-full bg-saffron-100 px-2.5 py-1 text-[0.6875rem] font-bold text-saffron-800"
            >
              {suggestion.label} · +{suggestion.protein} g
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
