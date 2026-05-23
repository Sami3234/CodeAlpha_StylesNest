/** Coerce unknown values to a finite number for UI display (avoids React NaN children). */
export function safeCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function safeAmount(value: unknown): number {
  return safeCount(value);
}
