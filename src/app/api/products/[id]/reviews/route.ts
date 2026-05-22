import { NextRequest, NextResponse } from 'next/server';
import {
  getProductReviewSummary,
  listApprovedProductReviews,
} from '@/lib/product-reviews';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

function parseProductId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const productId = parseProductId((await context.params).id);
    if (!productId) {
      return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    }

    const [reviews, summary] = await Promise.all([
      listApprovedProductReviews(productId),
      getProductReviewSummary(productId),
    ]);

    return NextResponse.json(
      { reviews, summary },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    );
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to load reviews', status: 500, cause: error });
  }
}
