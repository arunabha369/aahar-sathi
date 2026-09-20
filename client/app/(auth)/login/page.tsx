import type { Metadata } from 'next';
import { LoginForm } from '@/components/forms/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Aahar Sathi to see your 7-day Indian meal plan, water tracker and progress.',
};

export default async function LoginPage(props: PageProps<'/login'>) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === 'string' ? searchParams.next : undefined;

  return <LoginForm {...(next ? { next } : {})} />;
}
