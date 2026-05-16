'use client';

import { useCallback, useEffect, useState } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import PasswordStrengthList from '@/components/auth/PasswordStrengthList';
import MathCaptchaField from '@/components/auth/MathCaptchaField';
import GoogleIcon from '@/components/auth/GoogleIcon';
import { createMathCaptcha, isMathCaptchaCorrect, type MathCaptcha } from '@/lib/math-captcha';
import { passwordsMatch, validatePasswordStrength } from '@/lib/password-policy';
import { clientMessageFromApi } from '@/lib/safe-errors';

type Props = {
  callbackUrl: string;
  onSuccess: () => void;
  onClose: () => void;
};

export default function LoginFormContent({ callbackUrl, onSuccess, onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState<MathCaptcha>(() => createMathCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<{ google?: boolean; apple?: boolean }>({});

  const captchaFilled = captchaAnswer.trim().length > 0;
  const emailSubmitLocked = loading || !captchaFilled;

  const refreshCaptcha = useCallback(() => {
    setCaptcha(createMathCaptcha());
    setCaptchaAnswer('');
  }, []);

  useEffect(() => {
    getProviders().then((p) => {
      if (!p) return;
      setOauth({
        google: Boolean(p.google),
        apple: Boolean(p.apple),
      });
    });
  }, []);

  const switchMode = (next: 'signin' | 'register') => {
    setMode(next);
    setError('');
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
        setError('Invalid email or password');
        refreshCaptcha();
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requireCaptcha()) return;

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
        body: JSON.stringify({ name, email, password }),
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
    } finally {
      setLoading(false);
    }
  };

  const oauthSignIn = (provider: 'google' | 'apple') => {
    setError('');
    void signIn(provider, { callbackUrl });
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

      {(oauth.google || oauth.apple) && (
        <div className="login-oauth login-oauth--top">
          {oauth.google ? (
            <button
              type="button"
              className="login-oauth__btn"
              onClick={() => oauthSignIn('google')}
              disabled={loading}
            >
              <span className="login-oauth__icon" aria-hidden>
                <GoogleIcon size={20} />
              </span>
              Continue with Google
            </button>
          ) : null}
          {oauth.apple ? (
            <button
              type="button"
              className="login-oauth__btn login-oauth__btn--apple"
              onClick={() => oauthSignIn('apple')}
              disabled={loading}
            >
              Continue with Apple
            </button>
          ) : null}
        </div>
      )}

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
