import { GENERIC_CLIENT_ERROR, isProductionEnv } from '@/lib/safe-errors';

/** NextAuth / OAuth error codes → safe user-facing copy (no internals). */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: 'Sign-in was cancelled. You can try again when ready.',
  OAuthAccountNotLinked:
    'This email is already registered with a different sign-in method. Please use email and password.',
  OAuthSignin: 'Could not start Google sign-in. Please try again or use email.',
  OAuthCallback: 'Sign-in could not be completed. Please try again or use email.',
  OAuthCreateAccount: 'Could not create your account with Google. Please try email sign-up.',
  Callback: 'Sign-in could not be completed. Please try again.',
  Configuration: 'Sign-in is not set up on the server yet. Please use email or contact support.',
  Verification: 'The sign-in link expired. Please try again.',
  CredentialsSignin: 'Invalid email or password.',
  SessionRequired: 'Please sign in to continue.',
  Default: 'Sign-in could not be completed. Please try again or use email.',
};

export const GOOGLE_UNAVAILABLE_MESSAGE =
  'Google sign-in is not available right now. Please sign in with email or try again later.';

export const APPLE_UNAVAILABLE_MESSAGE =
  'Apple sign-in is not available right now. Please sign in with email instead.';

/**
 * Map `?error=` from NextAuth redirects to a safe message. Never returns raw stack/SQL text.
 */
export function messageFromAuthErrorCode(code: string | null | undefined): string | null {
  if (!code || typeof code !== 'string') return null;
  const key = code.trim();
  if (!key) return null;

  const known = AUTH_ERROR_MESSAGES[key];
  if (known) return known;

  if (isProductionEnv()) {
    return AUTH_ERROR_MESSAGES.Default;
  }

  if (/^[A-Za-z][A-Za-z0-9_]*$/.test(key) && key.length < 64) {
    return AUTH_ERROR_MESSAGES.Default;
  }

  return GENERIC_CLIENT_ERROR;
}
