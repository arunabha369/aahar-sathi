import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false },
  // The token is in the URL: don't leak it to other sites through the Referer header.
  referrer: 'no-referrer',
};

export default async function ResetPasswordPage(props: PageProps<'/reset-password'>) {
  const { token } = await props.searchParams;
  return <ResetPasswordForm token={typeof token === 'string' ? token : undefined} />;
}
