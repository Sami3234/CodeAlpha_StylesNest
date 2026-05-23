import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import {
  countOpenSupportTickets,
  listAdminSupportTickets,
  updateSupportTicket,
} from '@/lib/support-tickets';
import type { SupportTicketStatus } from '@/lib/support-tickets-schema';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

function parseStatus(raw: string | null): 'all' | SupportTicketStatus {
  if (raw === 'all') return 'all';
  if (raw === 'open' || raw === 'in_progress' || raw === 'resolved' || raw === 'closed') {
    return raw;
  }
  return 'open';
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const status = parseStatus(request.nextUrl.searchParams.get('status'));
    const [tickets, openCount] = await Promise.all([
      listAdminSupportTickets(status),
      countOpenSupportTickets(),
    ]);

    return NextResponse.json({ tickets, openCount });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to load support tickets', status: 500, cause: error });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isFinite(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 });
    }

    const status = body.status as SupportTicketStatus | undefined;
    if (
      status !== undefined &&
      status !== 'open' &&
      status !== 'in_progress' &&
      status !== 'resolved' &&
      status !== 'closed'
    ) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const ticket = await updateSupportTicket(id, {
      status,
      adminNotes: body.adminNotes,
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to update ticket', status: 500, cause: error });
  }
}
