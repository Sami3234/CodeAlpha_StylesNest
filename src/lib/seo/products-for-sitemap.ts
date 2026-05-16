import { sql } from '@/lib/db';
import { ensureProductSchema } from '@/lib/ensure-product-schema';

export type SitemapProduct = {
  id: number;
  updated_at: Date | string | null;
};

export async function getActiveProductsForSitemap(): Promise<SitemapProduct[]> {
  try {
    await ensureProductSchema();
    const rows = await sql`
      SELECT id, updated_at
      FROM products
      WHERE COALESCE(LOWER(TRIM(status)), 'active') != 'inactive'
      ORDER BY updated_at DESC NULLS LAST
    `;
    return rows.map((row) => ({
      id: Number(row.id),
      updated_at: row.updated_at as Date | string | null,
    }));
  } catch {
    return [];
  }
}
