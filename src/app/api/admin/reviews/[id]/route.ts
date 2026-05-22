import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { logAdminAction } from '@/lib/admin-audit';
import { deleteProductReview, setReviewStatus } from '@/lib/product-reviews';
import type { ReviewStatus } from '@/lib/product-reviews-schema';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

function parseReviewId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const reviewId = parseReviewId((await context.params).id);
    if (!reviewId) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const status = body.status as ReviewStatus;
    if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
      return NextResponse.json({ error: 'status must be approved, rejected, or pending' }, { status: 400 });
    }

    const result = await setReviewStatus(reviewId, status);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    await logAdminAction({
      adminId: admin.adminId,
      adminEmail: admin.email,
      action: `review.${status}`,
      entityType: 'product_review',
      entityId: String(reviewId),
      ip: clientIp(request),
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to update review', status: 500, cause: error });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const reviewId = parseReviewId((await context.params).id);
    if (!reviewId) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 });
    }

    const result = await deleteProductReview(reviewId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    await logAdminAction({
      adminId: admin.adminId,
      adminEmail: admin.email,
      action: 'review.delete',
      entityType: 'product_review',
      entityId: String(reviewId),
      ip: clientIp(request),
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to delete review', status: 500, cause: error });
  }
}
