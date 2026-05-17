/** Session-only cart line keys chosen for checkout (set on /cart, read on /cart/checkout). */

export const CHECKOUT_SELECTION_KEY = 'stylesnest-checkout-line-keys';
const LEGACY_CHECKOUT_KEY = 'stylesnest-checkout-product-ids';

export function persistCheckoutLineKeys(keys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const unique = [...new Set(keys.map((k) => k.trim()).filter(Boolean))];
    sessionStorage.setItem(CHECKOUT_SELECTION_KEY, JSON.stringify(unique));
  } catch {
    /* private mode / quota */
  }
}

export function readCheckoutLineKeys(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SELECTION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const keys = parsed
          .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          .map((k) => k.trim());
        return keys.length > 0 ? [...new Set(keys)] : null;
      }
    }

    const legacyRaw = sessionStorage.getItem(LEGACY_CHECKOUT_KEY);
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw) as unknown;
    if (!Array.isArray(legacy)) return null;
    const ids = legacy
      .map((x) => Math.floor(Number(x)))
      .filter((n) => Number.isFinite(n) && n >= 1);
    if (ids.length === 0) return null;
    return ids.map((id) => `${id}||`);
  } catch {
    return null;
  }
}

export function clearCheckoutLineKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(CHECKOUT_SELECTION_KEY);
    sessionStorage.removeItem(LEGACY_CHECKOUT_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated Use persistCheckoutLineKeys */
export function persistCheckoutProductIds(ids: number[]): void {
  persistCheckoutLineKeys(ids.map((id) => `${Math.floor(id)}||`));
}

/** @deprecated Use readCheckoutLineKeys */
export function readCheckoutProductIds(): number[] | null {
  const keys = readCheckoutLineKeys();
  if (!keys) return null;
  return [...new Set(keys.map((k) => Math.floor(Number(k.split('|')[0]))).filter((n) => n >= 1))];
}

/** @deprecated Use clearCheckoutLineKeys */
export function clearCheckoutProductIds(): void {
  clearCheckoutLineKeys();
}
