'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, getProviders } from 'next-auth/react';
import PasswordStrengthList from '@/components/auth/PasswordStrengthList';
import MathCaptchaField from '@/components/auth/MathCaptchaField';
import GoogleIcon from '@/components/auth/GoogleIcon';
import { createMathCaptcha, isMathCaptchaCorrect, type MathCaptcha } from '@/lib/math-captcha';
import {
  APPLE_UNAVAILABLE_MESSAGE,
  GOOGLE_UNAVAILABLE_MESSAGE,
  messageFromAuthErrorCode,
} from '@/lib/oauth-client-errors';
import { passwordsMatch, validatePasswordStrength } from '@/lib/password-policy';
import { clientMessageFromApi, GENERIC_CLIENT_ERROR } from '@/lib/safe-errors';

type Props = {
  callbackUrl: string;
  onSuccess: () => void;
  onClose: () => void;
};

export default function LoginFormContent({ callbackUrl, onSuccess, onClose }: Props) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState<MathCaptcha>(() => createMathCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const captchaFilled = captchaAnswer.trim().length > 0;
  const registerSubmitLocked =
    loading || oauthLoading || !captchaFilled || !acceptedTerms;
  const signInSubmitLocked = loading || oauthLoading || !captchaFilled;
  const emailSubmitLocked = mode === 'register' ? registerSubmitLocked : signInSubmitLocked;
  const oauthBusy = loading || oauthLoading;

  const refreshCaptcha = useCallback(() => {
    setCaptcha(createMathCaptcha());
    setCaptchaAnswer('');
  }, []);

  useEffect(() => {
    getProviders()
      .then((p) => {
        if (p?.apple) setAppleAvailable(true);
      })
      .catch(() => {
        /* ignore — Apple button stays hidden */
      });
  }, []);

  useEffect(() => {
    const authError = searchParams.get('error');
    const msg = messageFromAuthErrorCode(authError);
    if (msg) setError(msg);
  }, [searchParams]);

  const switchMode = (next: 'signin' | 'register') => {
    setMode(next);
    setError('');
    setAcceptedTerms(false);
    refreshCaptcha();
  };

  const requireCaptcha = (): boolean => {
    if (!captchaFilled) {
      setError('Please answer the security check.');
      return false;
    }
    if (isMathCaptchaCorrect(captchaAnswer, captcha)) return true;
    setError('Try again — your answer is not correct.');
    refreshCaptcha();
    return false;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!requireCaptcha()) return;

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError(messageFromAuthErrorCode(res.error) ?? 'Invalid email or password');
        refreshCaptcha();
        return;
      }
      if (res?.ok) {
        onSuccess();
      } else {
        setError(GENERIC_CLIENT_ERROR);
        refreshCaptcha();
      }
    } catch {
      setError(GENERIC_CLIENT_ERROR);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requireCaptcha()) return;

    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions to create an account.');
      return;
    }

    if (!passwordsMatch(password, confirmPassword)) {
      setError('Passwords do not match');
      return;
    }

    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      setError(pwCheck.errors.join('. '));
      return;
    }

    setLoading(true);
    try {
      const reg = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, acceptedTerms: true }),
      });
      const data = await reg.json();
      if (!reg.ok) {
        setError(clientMessageFromApi(data, 'Registration failed'));
        refreshCaptcha();
        return;
      }
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError('Account created. Please sign in.');
        setMode('signin');
        refreshCaptcha();
        return;
      }
      onSuccess();
    } catch {
      setError(GENERIC_CLIENT_ERROR);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const oauthSignIn = async (provider: 'google' | 'apple') => {
    setError('');
    setOauthLoading(true);
    try {
      const providers = await getProviders();
      if (!providers?.[provider]) {
        setError(provider === 'google' ? GOOGLE_UNAVAILABLE_MESSAGE : APPLE_UNAVAILABLE_MESSAGE);
        return;
      }
      await signIn(provider, { callbackUrl });
    } catch {
      setError(GENERIC_CLIENT_ERROR);
    } finally {
      setOauthLoading(false);
    }
  };

  const onCaptchaChange = (value: string) => {
    setCaptchaAnswer(value);
    if (error) setError('');
  };

  const captchaBlock = (
    <MathCaptchaField
      captcha={captcha}
      value={captchaAnswer}
      onChange={onCaptchaChange}
      onRefresh={refreshCaptcha}
      disabled={loading}
    />
  );

  return (
    <>
      <div className="login-modal__head">
        <h2 id="login-modal-title">{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
        <button type="button" className="login-modal__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <p className="login-card__sub">
        {mode === 'signin'
          ? 'Sign in to place orders. The shop stays open behind this window.'
          : 'Create your account with a strong password to shop safely.'}
      </p>

      <div className="login-oauth login-oauth--top">
        <button
          type="button"
          className="login-oauth__btn"
          onClick={() => void oauthSignIn('google')}
          disabled={oauthBusy}
          aria-busy={oauthLoading}
        >
          <span className="login-oauth__icon" aria-hidden>
            <GoogleIcon size={20} />
          </span>
          {oauthLoading ? 'Connecting…' : 'Continue with Google'}
        </button>
        {appleAvailable ? (
          <button
            type="button"
            className="login-oauth__btn login-oauth__btn--apple"
            onClick={() => void oauthSignIn('apple')}
            disabled={oauthBusy}
          >
            Continue with Apple
          </button>
        ) : null}
      </div>

      <div className="login-divider">
        <span>or use email</span>
      </div>

      {error ? <p className="login-error">{error}</p> : null}

      {mode === 'signin' ? (
        <form onSubmit={handleEmailSignIn} className="login-form">
          <label>
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {captchaBlock}

          <button type="submit" className="login-submit" disabled={emailSubmitLocked}>
            {loading ? 'Please wait…' : 'Sign in with email'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="login-form">
          <label>
            Full name
            <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <PasswordStrengthList password={password} confirmPassword={confirmPassword} showMatch />

          <div className="login-terms">
            <input
              id="login-accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (error) setError('');
              }}
              required
            />
            <label htmlFor="login-accept-terms" className="login-terms__text">
              I agree to the{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="login-terms__link"
                onClick={(e) => e.stopPropagation()}
              >
                Terms &amp; Conditions
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="login-terms__link"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          {captchaBlock}

          <button type="submit" className="login-submit" disabled={emailSubmitLocked}>
            {loading ? 'Please wait…' : 'Create account'}
          </button>
        </form>
      )}

      <p className="login-switch">
        {mode === 'signin' ? (
          <>
            New here?{' '}
            <button type="button" onClick={() => switchMode('register')}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => switchMode('signin')}>
              Sign in
            </button>
          </>
        )}
      </p>
    </>
  );
}
