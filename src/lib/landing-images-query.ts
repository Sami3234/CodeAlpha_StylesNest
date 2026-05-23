import { sql } from '@/lib/db';

export type LandingImageRow = {
  section: string;
  image_url: string;
  display_order: number;
  is_active: boolean | null;
};

/** Group active landing image URLs by section, sorted by display_order. */
export async function getLandingImagesBySection(): Promise<Record<string, string[]>> {
  if (!process.env.DATABASE_URL) {
    return {};
  }

  try {
    const rows = await sql`
      SELECT section, image_url, display_order, is_active
      FROM landing_images
      WHERE COALESCE(is_active, true) = true
      ORDER BY section ASC, display_order ASC, created_at ASC
    `;

    const grouped: Record<string, Array<{ url: string; order: number }>> = {};

    for (const row of rows) {
      const r = row as LandingImageRow;
      const url = typeof r.image_url === 'string' ? r.image_url.trim() : '';
      const section = typeof r.section === 'string' ? r.section.trim() : '';
      if (!url || !section) continue;

      if (!grouped[section]) grouped[section] = [];
      grouped[section].push({
        url,
        order: Number(r.display_order) || 0,
      });
    }

    const result: Record<string, string[]> = {};
    for (const [section, items] of Object.entries(grouped)) {
      items.sort((a, b) => a.order - b.order);
      result[section] = items.map((i) => i.url);
    }

    const legacyPurse = result.purse || [];
    const legacyLace = result.lace || [];
    delete result.purse;
    delete result.lace;
    result.jewelry = [...(result.jewelry || []), ...legacyPurse];
    result.clothes = [...(result.clothes || []), ...legacyLace];

    return result;
  } catch {
    return {};
  }
}

export async function getHeroBannerUrls(max = 4): Promise<string[]> {
  const grouped = await getLandingImagesBySection();
  return (grouped.hero || [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, max);
}
