import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import {
  countPendingReviews,
  listNewPendingReviewsSince,
} from '@/lib/product-reviews';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const since = request.nextUrl.searchParams.get('since');
    const [newReviews, pendingCount] = await Promise.all([
      listNewPendingReviewsSince(since),
      countPendingReviews(),
    ]);

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      pendingCount,
      newReviews,
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to sync reviews', status: 500, cause: error });
  }
}
