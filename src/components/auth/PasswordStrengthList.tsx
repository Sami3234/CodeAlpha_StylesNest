'use client';

import { validatePasswordStrength } from '@/lib/password-policy';

type Props = {
  password: string;
  confirmPassword?: string;
  showMatch?: boolean;
};

const RULES: { key: keyof ReturnType<typeof validatePasswordStrength>['checks']; label: string }[] = [
  { key: 'length', label: '8+ characters' },
  { key: 'upper', label: 'Uppercase letter' },
  { key: 'lower', label: 'Lowercase letter' },
  { key: 'number', label: 'Number' },
  { key: 'special', label: 'Special character' },
];

export default function PasswordStrengthList({ password, confirmPassword, showMatch }: Props) {
  const { checks } = validatePasswordStrength(password);
  const match =
    showMatch && confirmPassword !== undefined
      ? password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
      : null;

  if (!password && !confirmPassword) return null;

  return (
    <ul className="pw-strength" aria-live="polite">
      {RULES.map(({ key, label }) => (
        <li key={key} className={checks[key] ? 'pw-strength__item pw-strength__item--ok' : 'pw-strength__item'}>
          <span className="pw-strength__dot" aria-hidden />
          {label}
        </li>
      ))}
      {showMatch && confirmPassword !== undefined && confirmPassword.length > 0 ? (
        <li className={match ? 'pw-strength__item pw-strength__item--ok' : 'pw-strength__item'}>
          <span className="pw-strength__dot" aria-hidden />
          Passwords match
        </li>
      ) : null}
    </ul>
  );
}
