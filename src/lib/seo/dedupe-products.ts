/** Normalize product title for duplicate detection on shop / sitemap */
export function normalizeProductTitleKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Keep one listing per normalized title (lowest id = canonical).
 * Reduces duplicate-content signals when the same product was added twice.
 */
export function dedupeByProductTitle<T extends { id: number; name: string }>(items: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const item of items) {
    const key = normalizeProductTitleKey(item.name);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing || item.id < existing.id) {
      byKey.set(key, item);
    }
  }
  return Array.from(byKey.values());
}
