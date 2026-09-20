import type { Metadata } from 'next';
import { ProfileWizard } from '@/components/forms/ProfileWizard';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Set up your profile',
  robots: { index: false },
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  return (
    <div className="animate-rise">
      <div className="mx-auto mb-8 max-w-2xl">
        <p className="eyebrow">Set up</p>
        <h1 className="mt-2 text-[1.75rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[2rem]">
          Let&apos;s build your plan, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Three short steps. Everything here can be changed later from Settings.
        </p>
      </div>
      <ProfileWizard initialProfile={user.profile} />
    </div>
  );
}
