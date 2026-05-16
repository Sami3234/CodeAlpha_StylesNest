'use client';

import type { MathCaptcha } from '@/lib/math-captcha';

type Props = {
  captcha: MathCaptcha;
  value: string;
  onChange: (value: string) => void;
  onRefresh: () => void;
  disabled?: boolean;
};

export default function MathCaptchaField({ captcha, value, onChange, onRefresh, disabled }: Props) {
  return (
    <div className="login-captcha">
      <label className="login-captcha__label" htmlFor="login-math-captcha">
        Security check
      </label>
      <div className="login-captcha__row">
        <span className="login-captcha__question" aria-hidden>
          {captcha.label}
        </span>
        <input
          id="login-math-captcha"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d-]/g, ''))}
          placeholder="Ans"
          className="login-captcha__input"
          aria-label={`Answer: ${captcha.label}`}
        />
        <button
          type="button"
          className="login-captcha__refresh"
          onClick={onRefresh}
          disabled={disabled}
          aria-label="New question"
          title="New question"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
