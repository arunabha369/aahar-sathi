import Link from 'next/link';
import { NEEDS_PROFILE, SECTION_META, SETTINGS_SECTIONS, sectionHref, type SettingsSection } from '@/components/settings/sections';
import { cn } from '@/lib/utils';

/**
 * The settings menu: a list with hints on large screens, a row of chips on phones. Each
 * section is its own URL, so back and forward work and a section can be linked to.
 */
export function SettingsNav({ current, profileComplete }: { current: SettingsSection; profileComplete: boolean }) {
  const sections = SETTINGS_SECTIONS.filter((section) => profileComplete || !NEEDS_PROFILE.has(section));

  return (
    <nav aria-label="Settings sections">
      {/* Phones and tablets: chips that scroll sideways */}
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => {
          const { label, icon: Icon } = SECTION_META[section];
          const active = section === current;
          return (
            <li key={section} className="shrink-0">
              <Link
                href={sectionHref(section)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                  active ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-soft ring-1 ring-line hover:bg-surface-3 hover:text-ink',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: a list with a line on what each section holds */}
      <ul className="hidden space-y-1 lg:block">
        {sections.map((section) => {
          const { label, hint, icon: Icon } = SECTION_META[section];
          const active = section === current;
          return (
            <li key={section}>
              <Link
                href={sectionHref(section)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors',
                  active ? 'bg-surface-2 ring-1 ring-line' : 'hover:bg-surface-2/70',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-0 h-7 w-1 rounded-r-full bg-accent transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-xl ring-1 transition-colors',
                    active ? 'bg-accent text-accent-ink ring-transparent' : 'bg-surface-2 text-muted ring-line group-hover:text-ink',
                  )}
                >
                  <Icon className="size-[1.125rem]" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-sm font-bold', active ? 'text-ink' : 'text-ink-soft group-hover:text-ink')}>
                    {label}
                  </span>
                  <span className="block truncate text-xs text-muted">{hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
