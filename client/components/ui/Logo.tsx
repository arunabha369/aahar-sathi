import Link from 'next/link';
import { Mark, Wordmark } from '@/components/illustrations/Mark';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  showTagline?: boolean;
  tone?: 'light' | 'dark';
  className?: string;
}

export function Logo({ href = '/', showTagline = true, tone = 'dark', className }: LogoProps) {
  const content = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <Mark className="size-10 shrink-0" />
      <Wordmark tone={tone === 'light' ? 'light' : 'ink'} tagline={showTagline} />
    </span>
  );

  return href ? (
    <Link href={href} className="inline-flex min-h-11 items-center rounded-xl" aria-label="Aahar Sathi home">
      {content}
    </Link>
  ) : (
    content
  );
}
