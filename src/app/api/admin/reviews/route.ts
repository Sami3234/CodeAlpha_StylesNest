import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { countPendingReviews, listAdminReviews } from '@/lib/product-reviews';
import type { ReviewStatus } from '@/lib/product-reviews-schema';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

function parseStatusFilter(raw: string | null): 'all' | ReviewStatus {
  if (raw === 'pending' || raw === 'approved' || raw === 'rejected') return raw;
  return 'all';
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const status = parseStatusFilter(request.nextUrl.searchParams.get('status'));
    const [reviews, pendingCount] = await Promise.all([
      listAdminReviews(status),
      countPendingReviews(),
    ]);

    return NextResponse.json({ reviews, pendingCount });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to load reviews', status: 500, cause: error });
  }
}
