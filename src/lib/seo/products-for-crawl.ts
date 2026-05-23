import { sql } from '@/lib/db';
import { mapProductRow } from '@/lib/product-mapper';
import { dedupeByProductTitle } from '@/lib/seo/dedupe-products';

export type CrawlProduct = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
};

const MAX_CRAWL_PRODUCTS = 150;

/** Active products for server-rendered crawl HTML (shop SEO). */
export async function getProductsForCrawl(): Promise<CrawlProduct[]> {
  try {
    const rows = await sql`
      SELECT
        id, title_en, title_ar, current_price, image, category, status
      FROM products
      WHERE COALESCE(LOWER(TRIM(status)), 'active') != 'inactive'
      ORDER BY updated_at DESC NULLS LAST, id DESC
      LIMIT ${MAX_CRAWL_PRODUCTS}
    `;
    const mapped = rows.map((row) => {
      const p = mapProductRow(row as Record<string, unknown>);
      return {
        id: p.id,
        name: (p.title.en || p.title.ar || 'Product').trim(),
        price: p.currentPrice,
        category: p.category,
        image: p.image,
      };
    });
    return dedupeByProductTitle(mapped);
  } catch {
    return [];
  }
}
