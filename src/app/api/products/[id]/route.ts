import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { mapProductRow } from '@/lib/product-mapper';
import { apiErrorResponse } from '@/lib/safe-errors';
import {
  applyRealSoldCounts,
  getSoldCountsMapFromOrders,
} from '@/lib/product-sold-count';
import {
  attachReviewSummariesToProducts,
  getProductReviewSummariesMap,
} from '@/lib/product-reviews';

export const dynamic = 'force-dynamic';

/** Public: single active product for product detail page */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const id = Math.floor(Number(rawId));
    if (!Number.isFinite(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
    }

    await ensureProductSchema();

    const rows = await sql`
      SELECT
        id, title_en, title_ar, description_en, description_ar,
        current_price, original_price, discount, image, images,
        free_delivery, delivery_charge, sold_count, category, features_en, features_ar,
        pricing_tiers, clothes_options, shoes_options, product_meta,
        status, created_at, updated_at
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const mapped = mapProductRow(rows[0] as Record<string, unknown>);
    if (mapped.status === 'inactive') {
      return NextResponse.json({ error: 'Product not available.' }, { status: 404 });
    }

    const [withSold] = applyRealSoldCounts([mapped], await getSoldCountsMapFromOrders());
    const reviewSummaries = await getProductReviewSummariesMap();
    const [product] = attachReviewSummariesToProducts([withSold], reviewSummaries);

    return NextResponse.json(
      { product },
      { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } },
    );
  } catch (error) {
    return apiErrorResponse({
      message: 'Could not load product.',
      status: 500,
      cause: error,
    });
  }
}
