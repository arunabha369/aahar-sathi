import type { Metadata } from 'next';
import { Panel, PanelHeader, PageHeader } from '@/components/ui/Card';
import { DangerZone } from '@/components/forms/DangerZone';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { serverFetch } from '@/lib/api/server';
import { getCurrentUser } from '@/lib/auth';
import type { ProfileResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const { profile, targets } = await serverFetch<ProfileResponse>('/profile');

  return (
    <div className="animate-rise">
      <PageHeader eyebrow="Account" title="Settings" description={`Signed in as ${user.email}`} />

      <ProfileForm profile={profile} currentTargets={targets} />

      <div className="mt-5">
        <Panel>
          <PanelHeader eyebrow="Account" title="Session and data" />
          <DangerZone email={user.email} />
        </Panel>
      </div>
    </div>
  );
}
