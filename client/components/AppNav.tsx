'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { CalendarRange, LayoutDashboard, LogOut, Settings, ShoppingBasket, TrendingUp } from 'lucide-react';
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
    <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col border-r border-line bg-white lg:flex">
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
                    active ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-canvas hover:text-ink',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-0 h-6 w-1 rounded-r-full bg-brand-700 transition-opacity',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <link.icon
                    className={cn('size-[1.125rem]', active ? 'text-brand-700' : 'text-muted group-hover:text-ink')}
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
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-800">
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
          className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas hover:text-ink disabled:opacity-60"
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
  const { signOut, pending } = useSignOut();

  return (
    <header className="no-print sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2.5 rounded-xl" aria-label="Aahar Sathi home">
        <Mark className="size-9" />
        <span className="text-[0.9375rem] font-extrabold tracking-tight text-ink">Aahar Sathi</span>
      </Link>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-[0.8125rem] font-semibold text-ink-soft disabled:opacity-60"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-800">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <LogOut className="size-4 text-muted" aria-hidden="true" />
        <span className="sr-only">Sign out</span>
      </button>
    </header>
  );
}

export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Main"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[0.625rem] font-bold transition-colors',
                  active ? 'text-brand-800' : 'text-muted',
                )}
              >
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-lg transition-colors',
                    active ? 'bg-brand-50' : 'bg-transparent',
                  )}
                >
                  <link.icon className="size-[1.125rem]" aria-hidden="true" />
                </span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
