import type { Metadata } from 'next';
import { LoginForm } from '@/components/forms/LoginForm';
import { SIGN_IN_ERRORS, googleSignInEnabled } from '@/lib/authOptions';
import { safeNextPath } from '@/lib/safeNext';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Aahar Sathi to see your 7-day Indian meal plan, water tracker and progress.',
};

export default async function LoginPage(props: PageProps<'/login'>) {
  const searchParams = await props.searchParams;
  const next = safeNextPath(typeof searchParams.next === 'string' ? searchParams.next : undefined);
  const error = typeof searchParams.error === 'string' ? SIGN_IN_ERRORS[searchParams.error] : undefined;

  return <LoginForm next={next} googleEnabled={googleSignInEnabled()} initialError={error} />;
}
