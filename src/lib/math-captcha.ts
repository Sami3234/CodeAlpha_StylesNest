export type MathCaptcha = {
  id: string;
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
  label: string;
};

function buildCaptchaPool(): MathCaptcha[] {
  const pool: MathCaptcha[] = [];
  const seen = new Set<string>();

  for (let a = 1; a <= 12; a++) {
    for (let b = 1; b <= 12; b++) {
      const plusKey = `+:${a}:${b}`;
      if (!seen.has(plusKey)) {
        seen.add(plusKey);
        pool.push({
          id: plusKey,
          a,
          b,
          op: '+',
          answer: a + b,
          label: `${a} + ${b} = ?`,
        });
      }
      if (a > b) {
        const minusKey = `-:${a}:${b}`;
        if (!seen.has(minusKey)) {
          seen.add(minusKey);
          pool.push({
            id: minusKey,
            a,
            b,
            op: '-',
            answer: a - b,
            label: `${a} - ${b} = ?`,
          });
        }
      }
    }
  }

  return pool;
}

const CAPTCHA_POOL = buildCaptchaPool();

let lastCaptchaId: string | null = null;

export function getMathCaptchaPoolSize(): number {
  return CAPTCHA_POOL.length;
}

export function createMathCaptcha(): MathCaptcha {
  if (CAPTCHA_POOL.length === 0) {
    return { id: 'fallback', a: 2, b: 1, op: '+', answer: 3, label: '2 + 1 = ?' };
  }

  let picked = CAPTCHA_POOL[Math.floor(Math.random() * CAPTCHA_POOL.length)];
  let attempts = 0;
  while (picked.id === lastCaptchaId && attempts < 12) {
    picked = CAPTCHA_POOL[Math.floor(Math.random() * CAPTCHA_POOL.length)];
    attempts += 1;
  }
  lastCaptchaId = picked.id;
  return picked;
}

export function isMathCaptchaCorrect(input: string, captcha: MathCaptcha): boolean {
  const value = Number.parseInt(input.trim(), 10);
  return Number.isFinite(value) && value === captcha.answer;
}
