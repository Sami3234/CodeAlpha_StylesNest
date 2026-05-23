import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/safe-errors';
import { validateAdminSession } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    const session = await validateAdminSession(token, { touch: false });

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        },
      );
    }

    return NextResponse.json(
      { authenticated: true, email: session.email },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    return apiErrorResponse({
      message: 'Could not verify session',
      status: 500,
      cause: error,
    });
  }
}
