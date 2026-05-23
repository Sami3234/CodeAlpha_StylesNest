import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { apiErrorResponse } from '@/lib/safe-errors';
import { recalculateAllSoldCountsFromOrders } from '@/lib/product-sold-count';

export const dynamic = 'force-dynamic';

/** Admin: rebuild sold_count from all non-cancelled orders. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const result = await recalculateAllSoldCountsFromOrders();
    return NextResponse.json({
      success: true,
      message: `Synced sold counts for ${result.productsUpdated} products.`,
      productsUpdated: result.productsUpdated,
    });
  } catch (error) {
    return apiErrorResponse({
      message: 'Failed to sync sold counts',
      status: 500,
      cause: error,
    });
  }
}
