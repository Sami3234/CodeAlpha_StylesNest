export type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

export type PasswordValidation = {
  valid: boolean;
  errors: string[];
  checks: PasswordChecks;
};

const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export function validatePasswordStrength(password: string): PasswordValidation {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: SPECIAL.test(password),
  };

  const errors: string[] = [];
  if (!checks.length) errors.push('At least 8 characters');
  if (!checks.upper) errors.push('One uppercase letter');
  if (!checks.lower) errors.push('One lowercase letter');
  if (!checks.number) errors.push('One number');
  if (!checks.special) errors.push('One special character (!@#$… )');

  return {
    valid: errors.length === 0,
    errors,
    checks,
  };
}

export function passwordsMatch(a: string, b: string): boolean {
  return a.length > 0 && a === b;
}
