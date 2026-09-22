import { CalendarClock, Moon, Refrigerator, Sunrise } from 'lucide-react';
import { WEEKDAY_LABELS } from '@/lib/constants';
import type { BatchTask, PrepPlanResponse } from '@/lib/types';

function dayRange(days: string[]): string {
  if (days.length === 0) return '';
  if (days.length === 1) return WEEKDAY_LABELS[days[0]!] ?? days[0]!;
  return `${days[0]}–${days.at(-1)}`;
}

function TaskCard({ task }: { task: BatchTask }) {
  const days = [...new Set(task.meals.map((meal) => meal.day))];
  return (
    <li className="rounded-2xl bg-surface-2 p-4 ring-1 ring-line">
      <h3 className="text-[0.9375rem] font-bold text-ink">{task.title}</h3>
      {task.amounts.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {task.amounts.map((amount) => (
            <li key={amount.name} className="rounded-lg bg-surface px-2.5 py-1.5 text-[0.8125rem] ring-1 ring-line">
              <span className="font-semibold text-ink">{amount.name}</span>
              {amount.amount ? <span className="ml-1.5 font-bold tabular-nums text-brand-800">{amount.amount}</span> : null}
              {amount.detail ? <span className="block text-[0.75rem] text-muted">{amount.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-soft">{task.how}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[0.75rem] font-semibold text-muted">
        <Refrigerator className="size-3.5 shrink-0" aria-hidden="true" />
        {task.storage}
      </p>
      <p className="mt-1 text-[0.75rem] text-muted">
        For {days.map((day) => WEEKDAY_LABELS[day] ?? day).join(', ')}:{' '}
        {[...new Set(task.meals.map((meal) => meal.name))].join(' · ')}
      </p>
    </li>
  );
}

/** The week's prep: a Sunday session, a Wednesday top-up, and what to marinate the night before. */
export function PrepPlan({ prep }: { prep: PrepPlanResponse }) {
  return (
    <div className="space-y-5">
      {prep.sessions.map((session) => (
        <section key={session.key} className="surface p-5 sm:p-6" data-print="card">
          <header className="mb-4 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 ring-1 ring-line">
              <CalendarClock className="size-[1.125rem] text-brand-700" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink sm:text-lg">{session.title}</h2>
              <p className="text-sm text-muted">
                {session.tasks.length} {session.tasks.length === 1 ? 'job' : 'jobs'} · covers {dayRange(session.covers)}
              </p>
            </div>
          </header>
          <ol className="grid gap-3 lg:grid-cols-2">
            {session.tasks.map((task) => (
              <TaskCard key={task.task} task={task} />
            ))}
          </ol>
        </section>
      ))}

      {prep.nightBefore.length > 0 ? (
        <section className="surface p-5 sm:p-6" data-print="card">
          <header className="mb-4 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 ring-1 ring-line">
              <Moon className="size-[1.125rem] text-brand-700" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink sm:text-lg">The night before</h2>
              <p className="text-sm text-muted">Marinades only keep a day, so do these the evening before.</p>
            </div>
          </header>
          <ul className="space-y-4">
            {prep.nightBefore.map((evening) => (
              <li key={evening.day}>
                <p className="eyebrow mb-2">For {WEEKDAY_LABELS[evening.day] ?? evening.day}</p>
                <ol className="grid gap-3 lg:grid-cols-2">
                  {evening.tasks.map((task) => (
                    <TaskCard key={task.task} task={task} />
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {prep.onTheDay.length > 0 ? (
        <section className="surface p-5 sm:p-6" data-print="card">
          <header className="mb-4 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 ring-1 ring-line">
              <Sunrise className="size-[1.125rem] text-brand-700" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink sm:text-lg">Fresh on the day</h2>
              <p className="text-sm text-muted">These would not keep from the last prep session, so make them the same day.</p>
            </div>
          </header>
          <ul className="space-y-4">
            {prep.onTheDay.map((day) => (
              <li key={day.day}>
                <p className="eyebrow mb-2">{WEEKDAY_LABELS[day.day] ?? day.day}</p>
                <ol className="grid gap-3 lg:grid-cols-2">
                  {day.tasks.map((task) => (
                    <TaskCard key={task.task} task={task} />
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
