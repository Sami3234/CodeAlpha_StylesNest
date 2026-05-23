import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { queryAdminDashboardOverview } from '@/lib/admin-dashboard-stats';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const overview = await queryAdminDashboardOverview();

    return NextResponse.json(overview, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    return apiErrorResponse({
      message: 'Failed to load dashboard stats',
      status: 500,
      cause: error,
    });
  }
}
