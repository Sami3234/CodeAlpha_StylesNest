import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  createSupportTicket,
  validateCreateSupportTicket,
} from '@/lib/support-tickets';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await auth();
    const shopUserId = session?.user?.id ? Number(session.user.id) : null;

    const validated = validateCreateSupportTicket({
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
      shopUserId: Number.isFinite(shopUserId) ? shopUserId : null,
    });

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const ticket = await createSupportTicket(validated.data);

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      message: 'Your message has been sent. Our support team will contact you soon.',
    });
  } catch (error) {
    return apiErrorResponse({
      message: 'Failed to submit support request',
      status: 500,
      cause: error,
    });
  }
}
