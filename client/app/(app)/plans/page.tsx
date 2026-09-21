import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { GeneratePlanButton } from '@/components/plan/GeneratePlanButton';
import { PlanHistory } from '@/components/plan/PlanHistory';
import { serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import type { PlanListResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Your plans',
  robots: { index: false },
};

export default async function PlansPage(props: PageProps<'/plans'>) {
  await requireCompleteProfile();
  const searchParams = await props.searchParams;
  const page = Number(typeof searchParams.page === 'string' ? searchParams.page : '1') || 1;

  const { plans, totalPages, total } = await serverFetch<PlanListResponse>(`/plans?page=${page}&limit=10`);

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="History"
        title="Your plans"
        description={
          total === 0
            ? 'Every plan you generate is kept here.'
            : `${total} plan${total === 1 ? '' : 's'} so far. Open any one to read it, or make it active again.`
        }
        actions={<GeneratePlanButton label="New plan" />}
      />

      {plans.length === 0 ? (
        <EmptyState
          art="plate"
          title="No plans yet"
          description="Generate your first 7-day plan and it will show up here, along with every plan you make later."
          action={<GeneratePlanButton />}
        />
      ) : (
        <>
          <PlanHistory plans={plans} />

          {totalPages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <Link
                  key={number}
                  href={`/plans?page=${number}`}
                  aria-current={number === page ? 'page' : undefined}
                  className={cn(
                    'grid min-h-11 min-w-11 place-items-center rounded-xl px-3 text-sm font-bold transition-colors',
                    number === page
                      ? 'bg-accent text-accent-ink'
                      : 'bg-surface-2 text-muted ring-1 ring-line hover:text-ink',
                  )}
                >
                  {number}
                </Link>
              ))}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
