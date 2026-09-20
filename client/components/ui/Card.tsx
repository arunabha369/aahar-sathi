import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  raised?: boolean;
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
} as const;

export function Panel({ children, className, as: Tag = 'div', padding = 'md', raised = false }: PanelProps) {
  return (
    <Tag data-print="card" className={cn('min-w-0', raised ? 'surface-raised' : 'surface', PADDING[padding], className)}>
      {children}
    </Tag>
  );
}

/** Panel header: an eyebrow, a title and optional trailing actions on one baseline. */
export function PanelHeader({
  title,
  eyebrow,
  description,
  icon,
  actions,
  className,
}: {
  title: ReactNode;
  eyebrow?: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas ring-1 ring-line">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
          <h2 className="text-base font-bold text-ink sm:text-lg">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="text-[1.75rem] font-extrabold leading-tight text-ink sm:text-[2rem]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
