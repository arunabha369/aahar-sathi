import type { Metadata } from 'next';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { googleSignInEnabled } from '@/lib/authOptions';

export const metadata: Metadata = {
  title: 'Create your account',
  description:
    'Create a free Aahar Sathi account and get a personalised 7-day Indian meal plan with calorie and macro targets.',
};

export default function RegisterPage() {
  return <RegisterForm googleEnabled={googleSignInEnabled()} />;
}
