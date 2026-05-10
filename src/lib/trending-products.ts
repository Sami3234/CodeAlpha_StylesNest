/** Max products admins can pin for the home page trending strip */
export const MAX_TRENDING_PRODUCTS = 15;

/** Parse stored JSON/jsonb from DB into deduped positive integer IDs (order preserved). */
export function coerceTrendingIds(raw: unknown): number[] {
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const x of arr) {
    const n = typeof x === 'number' ? x : parseInt(String(x), 10);
    if (!Number.isInteger(n) || n <= 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/** Parse admin/API payload: ordered unique IDs capped at max trending slots */
export function normalizeTrendingSelection(raw: unknown): number[] {
  return coerceTrendingIds(raw).slice(0, MAX_TRENDING_PRODUCTS);
}
