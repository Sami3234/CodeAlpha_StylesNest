import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { queryAdminBootstrap } from '@/lib/admin-bootstrap';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

/** Single admin load: orders, stats, products, dashboard counts — one auth check. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request, { touch: false });
    if (!admin.ok) return admin.response;

    const payload = await queryAdminBootstrap();

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    return apiErrorResponse({
      message: 'Failed to load admin data',
      status: 500,
      cause: error,
    });
  }
}
