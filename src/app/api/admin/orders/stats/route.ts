import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { apiErrorResponse } from '@/lib/safe-errors';
import { queryAdminOrderStats } from '@/lib/admin-orders-query';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const stats = await queryAdminOrderStats();

    return NextResponse.json(
      { stats },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
    );
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to load order stats', status: 500, cause: error });
  }
}
