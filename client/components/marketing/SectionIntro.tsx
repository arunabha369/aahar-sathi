import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Eyebrow + heading + lede — the one way every landing section introduces itself. */
export function SectionIntro({
  id,
  eyebrow,
  title,
  children,
  align = 'left',
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn('reveal max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      <p className="text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-brand-700">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-[2rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.625rem]">
        {title}
      </h2>
      {children ? <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted sm:text-lg">{children}</p> : null}
    </div>
  );
}
