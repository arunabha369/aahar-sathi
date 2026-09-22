'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ApiError, api } from '@/lib/api/client';

interface FormState {
  error?: string;
  sentTo?: string;
  /** What was typed, kept across React's reset of the form after an error. */
  email?: string;
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const email = String(formData.get('email') ?? '').trim();
      if (!email.includes('@')) return { error: 'Enter the email address you signed up with.', email };

      try {
        await api.post('/auth/forgot-password', { email });
        return { sentTo: email };
      } catch (error) {
        return {
          error: error instanceof ApiError ? error.message : 'We could not reach the server. Please try again.',
          email,
        };
      }
    },
    {},
  );

  if (state.sentTo) {
    return (
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 ring-1 ring-inset ring-brand-200">
          <MailCheck className="size-6 text-accent" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[1.75rem] font-extrabold tracking-tight text-ink">Check your email</h1>
        {/* The same words whether or not the address has an account — nothing to learn here. */}
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted" role="status">
          If an account uses <strong className="font-bold text-ink">{state.sentTo}</strong>, a link to choose a new
          password is on its way. It works once and expires in 30 minutes.
        </p>
        <p className="mt-4 text-sm text-muted">Nothing after a few minutes? Check spam, or try again in a minute.</p>
        <p className="mt-8 text-sm text-muted">
          <Link href="/login" className="-my-3 inline-block py-3 font-bold text-brand-800 underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight text-ink">Forgot your password?</h1>
      <p className="mt-2 text-[0.9375rem] text-muted">Enter your email and we’ll send you a link to choose a new one.</p>

      <form action={formAction} className="mt-7 space-y-4" noValidate>
        <Field
          label="Email"
          name="email"
          defaultValue={state.email}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          error={state.error}
        />
        <Button type="submit" size="lg" fullWidth pending={pending}>
          {pending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{' '}
        <Link href="/login" className="-my-3 inline-block py-3 font-bold text-brand-800 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
