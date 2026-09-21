'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { ApiError, api } from '@/lib/api/client';
import type { UserResponse } from '@/lib/types';

interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function RegisterForm() {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const name = String(formData.get('name') ?? '').trim();
      const email = String(formData.get('email') ?? '').trim();
      const password = String(formData.get('password') ?? '');

      const fieldErrors: Record<string, string> = {};
      if (name.length < 2) fieldErrors.name = 'Please enter your name.';
      if (!email.includes('@')) fieldErrors.email = 'Enter a valid email address.';
      if (password.length < 8) fieldErrors.password = 'Password must be at least 8 characters.';
      if (Object.keys(fieldErrors).length > 0) {
        return { error: 'Please fix the highlighted fields.', fieldErrors };
      }

      try {
        await api.post<UserResponse>('/auth/register', { name, email, password });
        router.push('/onboarding');
        router.refresh();
        return {};
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            error: error.message,
            fieldErrors: Object.fromEntries(
              (error.details ?? []).map((detail) => [detail.field, detail.message]),
            ),
          };
        }
        return { error: 'We could not reach the server. Please try again.' };
      }
    },
    {},
  );

  return (
    <div>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight text-ink">Create your account</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        One minute of setup, and your first 7-day plan is ready.
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
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Asha Verma"
          required
          error={state.fieldErrors?.name}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          error={state.fieldErrors?.email}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          hint="Use at least 8 characters — a phrase works well."
          error={state.fieldErrors?.password}
        />

        <Button type="submit" size="lg" fullWidth pending={pending}>
          {pending ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="-my-3 inline-block py-3 font-bold text-brand-800 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
