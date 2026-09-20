import { redirect } from 'next/navigation';
import { ServerApiError, serverFetch } from '@/lib/api/server';
import type { User, UserResponse } from '@/lib/types';

/**
 * Express is the real security boundary — proxy.ts only makes an optimistic guess
 * from the cookie, so every app page confirms the session here.
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const { user } = await serverFetch<UserResponse>('/auth/me');
    return user;
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect('/login');
    }
    throw error;
  }
}

/** For pages that need a finished profile — sends newcomers to onboarding. */
export async function requireCompleteProfile(): Promise<User> {
  const user = await getCurrentUser();
  if (!user.profileComplete) redirect('/onboarding');
  return user;
}
