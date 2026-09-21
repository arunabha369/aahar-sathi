'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { CalendarRange, LayoutDashboard, LogOut, Settings, ShoppingBasket, TrendingUp } from 'lucide-react';
import { InstallAppButton } from '@/components/InstallApp';
import { Logo } from '@/components/ui/Logo';
import { Mark } from '@/components/illustrations/Mark';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/grocery', label: 'Grocery', icon: ShoppingBasket },
  { href: '/plans', label: 'Plans', icon: CalendarRange },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

function useSignOut() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return {
    pending,
    signOut: () =>
      startTransition(async () => {
        await api.post('/auth/logout');
        router.push('/login');
        router.refresh();
      }),
  };
}

/** Desktop rail: the app's spine, always visible from lg up. */
export function Sidebar({ user }: { user: { name: string; email: string } }) {
  const isActive = useIsActive();
  const { signOut, pending } = useSignOut();

  return (
    <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col border-r border-line bg-surface lg:flex">
      <div className="px-5 py-6">
        <Logo href="/dashboard" />
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="space-y-1">
          {LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-surface-3 text-ink'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-0 h-6 w-1 rounded-r-full bg-accent transition-opacity',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <link.icon
                    className={cn('size-[1.125rem]', active ? 'text-accent' : 'text-muted group-hover:text-ink')}
                    aria-hidden="true"
                  />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <InstallAppButton className="mb-2" />
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-accent-ink">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.8125rem] font-bold text-ink">{user.name}</span>
            <span className="block truncate text-[0.6875rem] text-muted">{user.email}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-60"
        >
          <LogOut className="size-[1.125rem] text-muted" aria-hidden="true" />
          {pending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

/** Mobile chrome: a slim top bar and a thumb-reachable tab bar. */
export function MobileTopBar({ user }: { user: { name: string } }) {
  return (
    <header className="no-print sticky top-0 z-40 flex items-center justify-between border-b border-line bg-canvas/85 px-4 py-2.5 backdrop-blur-md lg:hidden">
      <Link href="/dashboard" className="flex min-h-11 items-center gap-2.5 rounded-xl" aria-label="Aahar Sathi home">
        <Mark className="size-9" />
        <span className="text-[0.9375rem] font-extrabold tracking-tight text-ink">Aahar Sathi</span>
      </Link>
      <div className="flex items-center gap-1">
        <InstallAppButton compact />
        <Link
          href="/settings"
          className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:bg-surface-2"
          aria-label="Open settings"
        >
          <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-extrabold text-accent-ink">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <Settings className="size-4 text-muted" aria-hidden="true" />
          <span className="sr-only">Settings</span>
        </Link>
      </div>
    </header>
  );
}

/** Thumb-reachable tab bar. Plans sits in the middle as the raised lime action, as in the reference design. */
export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Main"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {LINKS.map((link, index) => {
          const active = isActive(link.href);
          const centre = index === 2;
          return (
            <li key={link.href} className="flex justify-center">
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-bold transition-colors',
                  centre ? 'text-ink' : active ? 'text-accent' : 'text-muted hover:text-ink',
                )}
              >
                {centre ? (
                  <span
                    className={cn(
                      '-mt-6 grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[var(--shadow-brand)] ring-[5px] ring-canvas transition-transform active:scale-95',
                      active && 'outline-2 outline-offset-2 outline-accent',
                    )}
                  >
                    <link.icon className="size-6" aria-hidden="true" />
                  </span>
                ) : (
                  <link.icon className="size-[1.375rem]" aria-hidden="true" />
                )}
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
