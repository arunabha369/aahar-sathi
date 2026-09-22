'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import type { UserResponse } from '@/lib/types';

interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** What was typed, so a typo in the second box doesn't wipe the first. */
  values?: { password: string; confirm: string };
}

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const router = useRouter();
  const toast = useToast();

  const [state, formAction, pending] = useActionState(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const password = String(formData.get('password') ?? '');
      const confirm = String(formData.get('confirm') ?? '');
      const values = { password, confirm };
      if (password.length < 8) return { fieldErrors: { password: 'Password must be at least 8 characters.' }, values };
      if (password !== confirm) return { fieldErrors: { confirm: 'The two passwords don’t match.' }, values };

      try {
        const { user } = await api.post<UserResponse>('/auth/reset-password', { token, password });
        toast.success('Password changed — you’re signed in');
        router.push(user.profileComplete ? '/dashboard' : '/onboarding');
        router.refresh();
        return {};
      } catch (error) {
        if (error instanceof ApiError) {
          const fieldErrors = Object.fromEntries((error.details ?? []).map((detail) => [detail.field, detail.message]));
          return { error: fieldErrors.password ? undefined : error.message, fieldErrors, values };
        }
        return { error: 'We could not reach the server. Please try again.', values };
      }
    },
    {},
  );

  if (!token) {
    return (
      <div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight text-ink">This link is incomplete</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          Open the link from your email again — or ask for a new one.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-flex min-h-11 items-center font-bold text-brand-800 underline-offset-4 hover:underline">
          Send me a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight text-ink">Choose a new password</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">You’ll be signed in, and signed out everywhere else.</p>

      <form action={formAction} className="mt-7 space-y-4" noValidate>
        {state.error ? (
          <div role="alert" className="rounded-xl bg-chilli-50 px-4 py-3 text-sm font-semibold text-chilli-700 ring-1 ring-inset ring-chilli-200">
            {state.error}{' '}
            <Link href="/forgot-password" className="underline underline-offset-2">
              Send a new link
            </Link>
          </div>
        ) : null}

        <PasswordField
          label="New password"
          name="password"
          defaultValue={state.values?.password}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          hint="Use at least 8 characters — a phrase works well."
          error={state.fieldErrors?.password}
        />
        <PasswordField
          label="Type it again"
          name="confirm"
          defaultValue={state.values?.confirm}
          autoComplete="new-password"
          required
          error={state.fieldErrors?.confirm}
        />
        <Button type="submit" size="lg" fullWidth pending={pending}>
          {pending ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </div>
  );
}
