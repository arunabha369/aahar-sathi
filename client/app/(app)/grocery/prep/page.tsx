import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { GeneratePlanButton } from '@/components/plan/GeneratePlanButton';
import { GroceryTabs } from '@/components/plan/GroceryTabs';
import { PrepPlan } from '@/components/plan/PrepPlan';
import { serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import type { ActivePlanResponse, PrepPlanResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Sunday prep',
  robots: { index: false },
};

export default async function PrepPage() {
  await requireCompleteProfile();
  const { plan } = await serverFetch<ActivePlanResponse>('/plans/active');

  if (!plan) {
    return (
      <>
        <PageHeader eyebrow="Cooking plan" title="Sunday prep" />
        <EmptyState
          art="basket"
          title="Nothing to prep yet"
          description="Generate a plan and we will work out what you can cook ahead on Sunday to make the week easier."
          action={<GeneratePlanButton />}
        />
      </>
    );
  }

  const prep = await serverFetch<PrepPlanResponse>(`/plans/${plan.id}/prep`);
  const nothing = prep.sessions.length === 0 && prep.nightBefore.length === 0 && prep.onTheDay.length === 0;

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Cooking plan"
        title="Sunday prep"
        description="An hour or two on Sunday saves most of the week’s chopping, soaking and pressure-cooking. Everything is timed to be eaten while it keeps."
      />
      <GroceryTabs current="/grocery/prep" />
      {nothing ? (
        <EmptyState
          art="plate"
          title="This week needs no prep"
          description="Every meal this week is quick to cook fresh."
        />
      ) : (
        <PrepPlan prep={prep} />
      )}
    </div>
  );
}
