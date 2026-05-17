import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';

/** Disabled in production — use only for local troubleshooting when logged in as admin. */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const admin = await requireAdminSession(request);
  if (!admin.ok) return admin.response;
  return NextResponse.json({
    success: true,
    message: 'Debug endpoint is disabled in production. Use server logs for troubleshooting.',
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
