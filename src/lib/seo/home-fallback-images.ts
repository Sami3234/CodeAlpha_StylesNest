import { sql } from '@/lib/db';
import { ensureProductSchema } from '@/lib/ensure-product-schema';

export type HomeFallbackImages = Record<string, string[]>;

const SECTION_CATEGORIES: Record<string, string[]> = {
  garments: ['clothes', 'menfashion'],
  cosmetics: ['cosmetics', 'makeup'],
  electronics: ['electronics'],
  jewelry: ['jewelry', 'watches', 'bags'],
  general_store: ['general'],
  hero: ['general', 'cosmetics', 'electronics', 'clothes'],
};

const MAX_PER_SECTION = 6;

/** Product images used when admin landing uploads are missing (homepage sections). */
export async function getHomeFallbackImages(): Promise<HomeFallbackImages> {
  if (!process.env.DATABASE_URL) {
    return {};
  }

  try {
    await ensureProductSchema();
    const allCategories = [
      ...new Set(Object.values(SECTION_CATEGORIES).flat()),
    ];
    const rows = await sql`
      SELECT image, category
      FROM products
      WHERE COALESCE(LOWER(TRIM(status)), 'active') != 'inactive'
        AND TRIM(COALESCE(image, '')) != ''
      ORDER BY updated_at DESC NULLS LAST, id DESC
      LIMIT 80
    `;

    const byCategory = new Map<string, string[]>();
    for (const row of rows) {
      const cat = String((row as { category: string }).category || '')
        .toLowerCase()
        .trim();
      const image = String((row as { image: string }).image || '').trim();
      if (!cat || !image) continue;
      if (!allCategories.includes(cat)) continue;
      const list = byCategory.get(cat) || [];
      if (list.length < MAX_PER_SECTION) {
        list.push(image);
        byCategory.set(cat, list);
      }
    }

    const result: HomeFallbackImages = {};
    for (const [section, categories] of Object.entries(SECTION_CATEGORIES)) {
      const urls: string[] = [];
      for (const cat of categories) {
        const imgs = byCategory.get(cat.toLowerCase()) || [];
        for (const img of imgs) {
          if (!urls.includes(img)) urls.push(img);
          if (urls.length >= MAX_PER_SECTION) break;
        }
        if (urls.length >= MAX_PER_SECTION) break;
      }
      if (urls.length > 0) {
        result[section] = urls;
      }
    }

    return result;
  } catch {
    return {};
  }
}
