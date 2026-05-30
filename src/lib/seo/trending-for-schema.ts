import { sql } from '@/lib/db';
import { mapProductRow } from '@/lib/product-mapper';
import { SEO_TRENDING_IMAGE_COUNT } from '@/lib/trending-products';
import { fetchPinnedTrendingProductIds } from '@/lib/trending-product-ids';
import { absoluteUrl } from '@/lib/seo/site';
import { getProductTitle } from '@/utils/getProductText';

export type TrendingProductForSchema = {
  id: number;
  name: string;
  price: number;
  image: string;
  imageUrl: string;
};

function resolveProductImage(image: string, images?: string[]): string {
  const primary = image?.trim() || images?.find((u) => u?.trim())?.trim() || '';
  return primary;
}

/**
 * First N admin-pinned trending products for Google JSON-LD & Open Graph.
 * Auto-updates when you save Trending products in admin (same order as home strip).
 */
export async function getTrendingProductsForSchema(
  limit = SEO_TRENDING_IMAGE_COUNT,
): Promise<TrendingProductForSchema[]> {
  try {
    const ids = await fetchPinnedTrendingProductIds(limit);
    if (ids.length === 0) return [];

    const out: TrendingProductForSchema[] = [];

    for (const id of ids) {
      const rows = await sql`
        SELECT
          id, title_en, title_ar, current_price, image, images, status
        FROM products
        WHERE id = ${id}
        LIMIT 1
      `;
      if (!rows.length) continue;

      const product = mapProductRow(rows[0] as Record<string, unknown>);
      if (product.status === 'inactive') continue;

      const image = resolveProductImage(product.image, product.images);
      if (!image) continue;

      out.push({
        id: product.id,
        name: getProductTitle(product),
        price: product.currentPrice,
        image,
        imageUrl: image.startsWith('http') ? image : absoluteUrl(image),
      });
    }

    return out;
  } catch {
    return [];
  }
}
