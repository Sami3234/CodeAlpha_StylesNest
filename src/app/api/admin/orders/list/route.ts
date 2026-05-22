import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { apiErrorResponse } from '@/lib/safe-errors';
import { queryAdminOrdersList } from '@/lib/admin-orders-query';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const sp = request.nextUrl.searchParams;
    const page = Number(sp.get('page') || '1');
    const limit = Number(sp.get('limit') || '50');

    const result = await queryAdminOrdersList({
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 50,
      status: sp.get('status'),
      period: sp.get('period'),
      from: sp.get('from'),
      to: sp.get('to'),
      search: sp.get('q') || sp.get('search'),
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to list orders', status: 500, cause: error });
  }
}
