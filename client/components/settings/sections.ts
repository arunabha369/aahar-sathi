import { Bell, Smartphone, UserRound, Users, UtensilsCrossed, type LucideIcon } from 'lucide-react';

export const SETTINGS_SECTIONS = ['profile', 'food', 'family', 'reminders', 'account'] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const SECTION_META: Record<SettingsSection, { label: string; hint: string; icon: LucideIcon }> = {
  profile: { label: 'Profile', hint: 'Body, goal and diet', icon: UserRound },
  food: { label: 'Food & fasting', hint: 'Jain and fasting modes', icon: UtensilsCrossed },
  family: { label: 'Family', hint: 'People you cook for', icon: Users },
  reminders: { label: 'Reminders', hint: 'Water, meals, weigh-ins', icon: Bell },
  account: { label: 'App & account', hint: 'Install, sign out, delete', icon: Smartphone },
};

/** Sections that need a finished profile; before onboarding only Profile and App & account apply. */
export const NEEDS_PROFILE: ReadonlySet<SettingsSection> = new Set(['food', 'family', 'reminders']);

export function sectionFrom(value: string | string[] | undefined, profileComplete: boolean): SettingsSection {
  const wanted = Array.isArray(value) ? value[0] : value;
  const section = SETTINGS_SECTIONS.find((candidate) => candidate === wanted) ?? 'profile';
  return !profileComplete && NEEDS_PROFILE.has(section) ? 'profile' : section;
}

export const sectionHref = (section: SettingsSection) =>
  section === 'profile' ? '/settings' : `/settings?section=${section}`;
