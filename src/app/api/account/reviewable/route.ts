import { NextResponse } from 'next/server';
import { requireShopSession } from '@/lib/require-shop-session';
import { getReviewableItemsForUser } from '@/lib/product-reviews';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

function parseUserId(sessionUserId: string | undefined): number | null {
  if (!sessionUserId) return null;
  const id = Number(sessionUserId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET() {
  try {
    const { session, error: authError } = await requireShopSession();
    if (authError) return authError;

    const userId = parseUserId(session!.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await getReviewableItemsForUser(userId);
    return NextResponse.json({ items });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to load review options', status: 500, cause: error });
  }
}
