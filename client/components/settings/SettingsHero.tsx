import { DIET_OPTIONS, FASTING_LABELS, GOAL_OPTIONS } from '@/lib/constants';
import type { Profile, Targets, UserPreferences } from '@/lib/types';

interface SettingsHeroProps {
  name: string;
  email: string;
  profile: Partial<Profile>;
  targets: Targets | null;
  preferences: UserPreferences;
  people: number;
}

/** Who you are and how your plans are set up, at a glance. */
export function SettingsHero({ name, email, profile, targets, preferences, people }: SettingsHeroProps) {
  const facts = [
    targets ? `${targets.calories.toLocaleString('en-IN')} kcal a day` : null,
    GOAL_OPTIONS.find((option) => option.value === profile.goal)?.label ?? null,
    DIET_OPTIONS.find((option) => option.value === profile.diet)?.label ?? null,
    preferences.jain ? 'Jain' : null,
    FASTING_LABELS[preferences.fasting],
    people > 1 ? `Family of ${people}` : null,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <section
      aria-label="Your account"
      className="surface relative mb-6 overflow-hidden p-5 sm:p-6"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-24 size-72 rounded-full bg-accent/15 blur-3xl"
      />
      <div className="relative flex flex-wrap items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-xl font-extrabold text-accent-ink shadow-[var(--shadow-brand)] sm:size-16 sm:text-2xl">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Settings</p>
          <h1 className="truncate text-2xl font-extrabold leading-tight text-ink sm:text-[1.75rem]">{name}</h1>
          <p className="truncate text-sm text-muted">{email}</p>
        </div>
      </div>
      {facts.length > 0 ? (
        <ul className="relative mt-4 flex flex-wrap gap-1.5" aria-label="Your plan setup">
          {facts.map((fact, index) => (
            <li
              key={fact}
              className={
                index === 0 && targets
                  ? 'rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 ring-1 ring-inset ring-brand-200 tabular-nums'
                  : 'rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-soft ring-1 ring-inset ring-line'
              }
            >
              {fact}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
