import 'server-only';

/** "Continue with Google" shows only when the API has Google credentials to use. */
export function googleSignInEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** Messages for the `?error=` codes the Google callback redirects back with. */
export const SIGN_IN_ERRORS: Record<string, string> = {
  google_unavailable: 'Google sign-in isn’t set up on this server yet — use your email and password.',
  google_cancelled: 'Google sign-in was cancelled. You can try again, or use your email and password.',
  google_failed: 'We couldn’t sign you in with Google. Please try again.',
  google_unverified: 'Your Google account’s email address isn’t verified, so we can’t use it to sign you in.',
  google_conflict:
    'That email is already linked to a different Google account. Sign in with that one, or with your password.',
};
