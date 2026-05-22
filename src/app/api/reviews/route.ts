import { NextRequest, NextResponse } from 'next/server';
import { requireShopSession } from '@/lib/require-shop-session';
import { createProductReview } from '@/lib/product-reviews';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

function parseUserId(sessionUserId: string | undefined): number | null {
  if (!sessionUserId) return null;
  const id = Number(sessionUserId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: authError } = await requireShopSession();
    if (authError) return authError;

    const userId = parseUserId(session!.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const orderId = String(body.orderId ?? '').trim();
    const productId = Number(body.productId);
    const rating = Number(body.rating);
    const title = typeof body.title === 'string' ? body.title : '';
    const reviewBody = typeof body.body === 'string' ? body.body : String(body.comment ?? '');
    const images = Array.isArray(body.images)
      ? body.images.filter((u: unknown): u is string => typeof u === 'string')
      : [];

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json({ error: 'Valid product is required' }, { status: 400 });
    }

    const result = await createProductReview({
      userId,
      orderId,
      productId,
      rating,
      title,
      body: reviewBody,
      images,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        reviewId: result.reviewId,
        message: 'Thank you! Your review will appear after admin approval.',
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to submit review', status: 500, cause: error });
  }
}
