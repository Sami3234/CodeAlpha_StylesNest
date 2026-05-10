/** Session-only list of cart product IDs chosen for checkout (set on /cart, read on /cart/checkout). */

export const CHECKOUT_SELECTION_KEY = 'stylesnest-checkout-product-ids';

export function persistCheckoutProductIds(ids: number[]): void {
  if (typeof window === 'undefined') return;
  try {
    const unique = [...new Set(ids.map((n) => Math.floor(Number(n))).filter((n) => Number.isFinite(n) && n >= 1))];
    sessionStorage.setItem(CHECKOUT_SELECTION_KEY, JSON.stringify(unique));
  } catch {
    /* private mode / quota */
  }
}

export function readCheckoutProductIds(): number[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SELECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const nums = parsed
      .map((x) => Math.floor(Number(x)))
      .filter((n) => Number.isFinite(n) && n >= 1);
    return [...new Set(nums)];
  } catch {
    return null;
  }
}

export function clearCheckoutProductIds(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(CHECKOUT_SELECTION_KEY);
  } catch {
    /* ignore */
  }
}
