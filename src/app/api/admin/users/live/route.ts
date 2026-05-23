import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { listNewShopUsersSince } from '@/lib/shop-users';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const since = request.nextUrl.searchParams.get('since');
    const newUsers = await listNewShopUsersSince(since);

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      newUsers,
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to sync users', status: 500, cause: error });
  }
}
