import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/init-db';
import { apiErrorResponse } from '@/lib/safe-errors';
import { requireAdminSession } from '@/lib/require-admin-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await requireAdminSession(request);
  if (!admin.ok) return admin.response;

  try {
    await initDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to initialize database', status: 500, cause: error });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
