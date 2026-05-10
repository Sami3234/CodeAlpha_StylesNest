import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureHomepageSettingsTable } from '@/lib/homepage-settings-schema';
import { coerceTrendingIds } from '@/lib/trending-products';

export const dynamic = 'force-dynamic';

/** Public: ordered trending product ids for home strip */
export async function GET() {
  try {
    await ensureHomepageSettingsTable();
    const rows = await sql`
      SELECT trending_product_ids FROM homepage_settings WHERE id = 1 LIMIT 1
    `;
    const raw = rows[0]?.trending_product_ids;
    const ids = coerceTrendingIds(raw ?? []);

    return NextResponse.json(
      { success: true, ids },
      {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    );
  } catch (error) {
    console.error('trending-products GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load trending products', ids: [] },
      { status: 500 }
    );
  }
}
