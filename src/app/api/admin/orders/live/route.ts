import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { apiErrorResponse } from '@/lib/safe-errors';
import {
  queryAbandonedCount,
  queryAdminOrderStats,
  queryOrdersChangedSince,
  queryRecentOrders,
} from '@/lib/admin-orders-query';

export const dynamic = 'force-dynamic';

/** Lightweight live sync: stats, recent orders, changes since timestamp. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const since = request.nextUrl.searchParams.get('since')?.trim() || null;
    const [stats, recentOrders, abandonedCount] = await Promise.all([
      queryAdminOrderStats(),
      queryRecentOrders(8),
      queryAbandonedCount(),
    ]);

    const changedOrders = since ? await queryOrdersChangedSince(since) : [];

    return NextResponse.json(
      {
        serverTime: new Date().toISOString(),
        stats,
        recentOrders,
        changedOrders,
        abandonedCount,
      },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
    );
  } catch (error) {
    return apiErrorResponse({ message: 'Live sync failed', status: 500, cause: error });
  }
}
