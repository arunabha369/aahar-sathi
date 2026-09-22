import type { Metadata } from 'next';
import { DiaryView } from '@/components/diary/DiaryView';
import { PageHeader } from '@/components/ui/Card';
import { serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import { todayKey } from '@/lib/format';
import type { DiaryDay } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Food diary',
  robots: { index: false },
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DiaryPage(props: PageProps<'/diary'>) {
  await requireCompleteProfile();
  const { date } = await props.searchParams;
  const serverToday = todayKey();
  // Only a real, non-future date; anything else shows today.
  const requested = typeof date === 'string' && DATE.test(date) && !Number.isNaN(Date.parse(date)) && date < serverToday ? date : null;
  const initial = await serverFetch<DiaryDay>(`/diary/${requested ?? serverToday}`);

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Tracking"
        title="Food diary"
        description="Tick off the planned meals you ate, and add anything else — the totals and your streak follow."
      />
      <DiaryView initial={initial} requestedDate={requested} serverToday={serverToday} />
    </div>
  );
}
