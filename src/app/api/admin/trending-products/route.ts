import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureHomepageSettingsTable } from '@/lib/homepage-settings-schema';
import {
  coerceTrendingIds,
  MAX_TRENDING_PRODUCTS,
  normalizeTrendingSelection,
} from '@/lib/trending-products';
import { requireAdminSession } from '@/lib/require-admin-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await requireAdminSession(request);
  if (!admin.ok) return admin.response;

  try {
    await ensureHomepageSettingsTable();
    const rows = await sql`
      SELECT trending_product_ids FROM homepage_settings WHERE id = 1 LIMIT 1
    `;
    const raw = rows[0]?.trending_product_ids;
    const normalized = coerceTrendingIds(raw ?? []);

    return NextResponse.json({
      success: true,
      ids: normalized,
      max: MAX_TRENDING_PRODUCTS,
    });
  } catch (error) {
    console.error('admin trending-products GET:', error);
    return NextResponse.json(
      { error: 'Failed to load trending products' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdminSession(request);
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const requested = normalizeTrendingSelection(body.ids);

    await ensureHomepageSettingsTable();

    const allRows = await sql`SELECT id FROM products`;
    const existing = new Set(
      allRows.map((r: Record<string, unknown>) => Number(r.id))
    );
    const validIds = requested.filter((id) => existing.has(id));

    const payload = JSON.stringify(validIds);

    await sql`
      UPDATE homepage_settings
      SET trending_product_ids = ${payload}::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `;

    return NextResponse.json({
      success: true,
      ids: validIds,
      max: MAX_TRENDING_PRODUCTS,
    });
  } catch (error) {
    console.error('admin trending-products PUT:', error);
    return NextResponse.json(
      { error: 'Failed to save trending products' },
      { status: 500 }
    );
  }
}
