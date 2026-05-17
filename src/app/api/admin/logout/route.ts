import { NextRequest, NextResponse } from 'next/server';
import { revokeAdminSession } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  await revokeAdminSession(token);

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
