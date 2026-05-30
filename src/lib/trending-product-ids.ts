import { sql } from '@/lib/db';
import { ensureHomepageSettingsTable } from '@/lib/homepage-settings-schema';
import { coerceTrendingIds } from '@/lib/trending-products';

/** Ordered trending product IDs from admin (same list as home strip). */
export async function fetchPinnedTrendingProductIds(limit?: number): Promise<number[]> {
  try {
    await ensureHomepageSettingsTable();
    const rows = await sql`
      SELECT trending_product_ids FROM homepage_settings WHERE id = 1 LIMIT 1
    `;
    const ids = coerceTrendingIds(rows[0]?.trending_product_ids ?? []);
    return limit != null ? ids.slice(0, limit) : ids;
  } catch {
    return [];
  }
}
