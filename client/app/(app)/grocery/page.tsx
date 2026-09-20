import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { GeneratePlanButton } from '@/components/plan/GeneratePlanButton';
import { GroceryList } from '@/components/plan/GroceryList';
import { serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import type { ActivePlanResponse, GroceryResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Grocery list',
  robots: { index: false },
};

export default async function GroceryPage() {
  await requireCompleteProfile();
  const { plan } = await serverFetch<ActivePlanResponse>('/plans/active');

  if (!plan) {
    return (
      <>
        <PageHeader eyebrow="Shopping" title="Grocery list" />
        <EmptyState
          art="basket"
          title="No grocery list yet"
          description="Generate a plan first and we will turn its meals into a shopping list, grouped by aisle."
          action={<GeneratePlanButton />}
        />
      </>
    );
  }

  const grocery = await serverFetch<GroceryResponse>(`/plans/${plan.id}/grocery`);

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Shopping"
        title="Grocery list"
        description="Everything this week's meals need, de-duplicated and grouped by aisle. Your ticks are saved as you shop."
      />
      <GroceryList planId={plan.id} groups={grocery.groups} total={grocery.total} checked={grocery.checked} />
    </div>
  );
}
