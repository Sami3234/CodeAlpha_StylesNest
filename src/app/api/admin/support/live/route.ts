import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { countOpenSupportTickets, listNewOpenSupportTicketsSince } from '@/lib/support-tickets';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const since = request.nextUrl.searchParams.get('since');
    const [newTickets, openCount] = await Promise.all([
      listNewOpenSupportTicketsSince(since),
      countOpenSupportTickets(),
    ]);

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      openCount,
      newTickets,
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to sync support', status: 500, cause: error });
  }
}
