'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { DemoButton } from '@/components/DemoButton';
import { GoogleButton } from '@/components/forms/GoogleButton';
import { ApiError, api } from '@/lib/api/client';
import type { UserResponse } from '@/lib/types';

interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** What was typed, so the email survives React resetting the form after an error. */
  email?: string;
}

export function LoginForm({
  next,
  googleEnabled,
  initialError,
}: {
  next?: string | undefined;
  googleEnabled: boolean;
  /** A message carried back from a failed Google sign-in. */
  initialError?: string | undefined;
}) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const email = String(formData.get('email') ?? '').trim();
      const password = String(formData.get('password') ?? '');

      if (!email || !password) {
        return { error: 'Please enter your email and password.', email };
      }

      try {
        const { user } = await api.post<UserResponse>('/auth/login', { email, password });
        const destination = next ?? (user.profileComplete ? '/dashboard' : '/onboarding');
        router.push(destination);
        router.refresh();
        return {};
      } catch (error) {
        if (error instanceof ApiError) {
          const fieldErrors = Object.fromEntries(
            (error.details ?? []).map((detail) => [detail.field, detail.message]),
          );
          return { error: error.message, fieldErrors, email };
        }
        return { error: 'We could not reach the server. Please try again.', email };
      }
    },
    initialError ? { error: initialError } : {},
  );

  return (
    <div>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Sign in to see today&apos;s meals, tick off the grocery list and log your water.
      </p>

      <form action={formAction} className="mt-7 space-y-4" noValidate>
        {state.error ? (
          <p
            role="alert"
            className="rounded-xl bg-chilli-50 px-4 py-3 text-sm font-semibold text-chilli-700 ring-1 ring-inset ring-chilli-200"
          >
            {state.error}
          </p>
        ) : null}

        <Field
          label="Email"
          name="email"
          defaultValue={state.email}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          error={state.fieldErrors?.email}
        />
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            error={state.fieldErrors?.password}
          />
          <p className="mt-1 text-right">
            <Link
              href="/forgot-password"
              className="-my-2 inline-flex min-h-11 items-center text-[0.8125rem] font-semibold text-brand-800 underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </div>

        <Button type="submit" size="lg" fullWidth pending={pending}>
          {pending ? 'Signing you in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.09em] text-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-3">
        {googleEnabled ? <GoogleButton next={next} /> : null}
        <DemoButton className="w-full" />
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        New here?{' '}
        <Link href="/register" className="-my-3 inline-block py-3 font-bold text-brand-800 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
