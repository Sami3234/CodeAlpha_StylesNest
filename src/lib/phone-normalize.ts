/** Digits only; last 10 for PK mobile matching (03XX… / 923XX…). */
export function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  const da = normalizePhoneDigits(a);
  const db = normalizePhoneDigits(b);
  if (!da || !db) return false;
  return da === db;
}
