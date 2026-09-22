import type { Metadata } from 'next';
import { Panel, PanelHeader } from '@/components/ui/Card';
import { DangerZone } from '@/components/forms/DangerZone';
import { InstallAppPanel } from '@/components/InstallApp';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { CalorieAdjustmentPanel } from '@/components/settings/CalorieAdjustmentPanel';
import { HouseholdPanel } from '@/components/settings/HouseholdPanel';
import { PlanOptionsPanel } from '@/components/settings/PlanOptionsPanel';
import { RemindersPanel } from '@/components/settings/RemindersPanel';
import { SettingsHero } from '@/components/settings/SettingsHero';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { SECTION_META, sectionFrom, type SettingsSection } from '@/components/settings/sections';
import { serverFetch } from '@/lib/api/server';
import { getCurrentUser } from '@/lib/auth';
import type {
  ActivePlanResponse,
  City,
  HouseholdResponse,
  ProfileResponse,
  ReminderSettingsResponse,
  UserPreferences,
} from '@/lib/types';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false },
};

/** Only what the open section needs is loaded. */
async function SectionBody({
  section,
  email,
  me,
  household,
}: {
  section: SettingsSection;
  email: string;
  me: ProfileResponse;
  household: HouseholdResponse;
}) {
  const plain = (preferences: UserPreferences) => {
    const { jain, fasting, vratDays, city } = preferences;
    return { jain, fasting, vratDays, city };
  };

  switch (section) {
    case 'profile':
      return (
        <div className="space-y-5">
          <ProfileForm profile={me.profile} currentTargets={me.targets} />
          {me.profileComplete ? <CalorieAdjustmentPanel adjustment={me.preferences.calorieAdjustment} /> : null}
        </div>
      );
    case 'food': {
      const { cities } = await serverFetch<{ cities: City[] }>('/fasting/cities');
      return <PlanOptionsPanel initial={plain(me.preferences)} cities={cities} />;
    }
    case 'family': {
      const { plan } = await serverFetch<ActivePlanResponse>('/plans/active');
      return (
        <HouseholdPanel initial={household} planHousehold={plan?.inputs.household?.map((member) => member.id) ?? []} />
      );
    }
    case 'reminders': {
      const reminders = await serverFetch<ReminderSettingsResponse>('/reminders/settings');
      return <RemindersPanel initial={reminders} />;
    }
    case 'account':
      return (
        <div className="space-y-5">
          <Panel>
            <PanelHeader
              eyebrow="App"
              title="Install Aahar Sathi"
              description="Keep it on your phone or computer and open it like any other app."
            />
            <InstallAppPanel />
          </Panel>
          <Panel>
            <PanelHeader eyebrow="Account" title="Session and data" />
            <DangerZone email={email} />
          </Panel>
        </div>
      );
  }
}

export default async function SettingsPage(props: PageProps<'/settings'>) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), props.searchParams]);
  const [me, household] = await Promise.all([
    serverFetch<ProfileResponse>('/profile'),
    serverFetch<HouseholdResponse>('/household'),
  ]);
  const section = sectionFrom(searchParams.section, me.profileComplete);
  const { label } = SECTION_META[section];

  return (
    <div className="animate-rise">
      <SettingsHero
        name={user.name}
        email={user.email}
        profile={me.profile}
        targets={me.targets}
        preferences={me.preferences}
        people={1 + household.members.length}
      />

      {/* grid-cols-1 with min-w-0: the sideways-scrolling chips must not stretch the page. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-6">
          <SettingsNav current={section} profileComplete={me.profileComplete} />
        </div>

        <section aria-labelledby="settings-section-title" className="min-w-0">
          <h2 id="settings-section-title" className="mb-4 text-xl font-extrabold text-ink lg:sr-only">
            {label}
          </h2>
          <SectionBody section={section} email={user.email} me={me} household={household} />
        </section>
      </div>
    </div>
  );
}
