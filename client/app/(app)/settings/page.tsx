import type { Metadata } from 'next';
import { Panel, PanelHeader, PageHeader } from '@/components/ui/Card';
import { DangerZone } from '@/components/forms/DangerZone';
import { InstallAppPanel } from '@/components/InstallApp';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { CalorieAdjustmentPanel } from '@/components/settings/CalorieAdjustmentPanel';
import { HouseholdPanel } from '@/components/settings/HouseholdPanel';
import { PlanOptionsPanel } from '@/components/settings/PlanOptionsPanel';
import { RemindersPanel } from '@/components/settings/RemindersPanel';
import { serverFetch } from '@/lib/api/server';
import { getCurrentUser } from '@/lib/auth';
import type {
  ActivePlanResponse,
  City,
  HouseholdResponse,
  ProfileResponse,
  ReminderSettingsResponse,
} from '@/lib/types';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [{ profile, targets, preferences }, { cities }, household, reminders, { plan }] = await Promise.all([
    serverFetch<ProfileResponse>('/profile'),
    serverFetch<{ cities: City[] }>('/fasting/cities'),
    serverFetch<HouseholdResponse>('/household'),
    serverFetch<ReminderSettingsResponse>('/reminders/settings'),
    serverFetch<ActivePlanResponse>('/plans/active'),
  ]);
  const { jain, fasting, vratDays, city } = preferences;

  return (
    <div className="animate-rise">
      <PageHeader eyebrow="Account" title="Settings" description={`Signed in as ${user.email}`} />

      <ProfileForm profile={profile} currentTargets={targets} />

      {user.profileComplete ? (
        <div className="mt-5 space-y-5">
          <PlanOptionsPanel initial={{ jain, fasting, vratDays, city }} cities={cities} />
          <HouseholdPanel
            initial={household}
            planHousehold={plan?.inputs.household?.map((member) => member.id) ?? []}
          />
          <RemindersPanel initial={reminders} />
          <CalorieAdjustmentPanel adjustment={preferences.calorieAdjustment} />
        </div>
      ) : null}

      <div className="mt-5">
        <Panel>
          <PanelHeader
            eyebrow="App"
            title="Install Aahar Sathi"
            description="Keep it on your phone or computer and open it like any other app."
          />
          <InstallAppPanel />
        </Panel>
      </div>

      <div className="mt-5">
        <Panel>
          <PanelHeader eyebrow="Account" title="Session and data" />
          <DangerZone email={user.email} />
        </Panel>
      </div>
    </div>
  );
}
