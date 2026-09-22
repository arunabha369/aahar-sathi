import Link from 'next/link';
import { Flame } from 'lucide-react';
import { Panel, PanelHeader } from '@/components/ui/Card';
import type { DiarySummary } from '@/lib/types';

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface-2 p-3.5">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd>
        <span className="mt-1 block text-2xl font-extrabold leading-none text-ink">{value}</span>
        <span className="mt-1.5 block text-xs text-muted">{detail}</span>
      </dd>
    </div>
  );
}

/** How the last seven days went against the plan: the streak, meals eaten, days on target. */
export function AdherenceCard({ summary }: { summary: DiarySummary }) {
  const { streak, week } = summary;
  const share = week.plannedMeals > 0 ? Math.round((week.eatenAsPlanned / week.plannedMeals) * 100) : 0;

  return (
    <Panel>
      <PanelHeader
        eyebrow="Last 7 days"
        title="Sticking to the plan"
        icon={<Flame className="size-[1.125rem] text-saffron-600" aria-hidden="true" />}
        actions={
          <Link href="/diary" className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-brand-800 hover:bg-surface-2">
            Open food diary
          </Link>
        }
      />
      <dl className="grid gap-2 sm:grid-cols-3">
        <Stat
          label="Logging streak"
          value={`${streak} ${streak === 1 ? 'day' : 'days'}`}
          detail={streak > 0 ? 'in a row — keep it going today' : 'Log a meal today to start one'}
        />
        <Stat
          label="Planned meals eaten"
          value={`${share}%`}
          detail={`${week.eatenAsPlanned} of ${week.plannedMeals} meals, as planned`}
        />
        <Stat
          label="Days on target"
          value={`${week.onTargetDays} of ${week.trackedDays}`}
          detail={
            week.trackedDays > 0
              ? 'fully tracked days within 10% of your calories'
              : 'Mark all five meals on a day to see this'
          }
        />
      </dl>
    </Panel>
  );
}
