import { BottomNav, MobileTopBar, Sidebar } from '@/components/AppNav';
import { getCurrentUser } from '@/lib/auth';
import { DISCLAIMER } from '@/lib/constants';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar user={{ name: user.name, email: user.email }} />
      <MobileTopBar user={{ name: user.name }} />

      <div className="lg:pl-[17rem]">
        <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6 lg:px-10 lg:pb-10">
          <p className="border-t border-line pt-6 text-xs leading-relaxed text-muted">
            <strong className="font-bold text-ink-soft">A note on safety:</strong> {DISCLAIMER}
          </p>
        </footer>
      </div>

      <BottomNav />
    </div>
  );
}
