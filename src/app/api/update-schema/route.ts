import { NextRequest, NextResponse } from 'next/server';
import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { apiErrorResponse } from '@/lib/safe-errors';
import { requireAdminSession } from '@/lib/require-admin-session';

export const dynamic = 'force-dynamic';

async function run(request: NextRequest) {
  const admin = await requireAdminSession(request);
  if (!admin.ok) return admin.response;

  try {
    await ensureProductSchema();
    return NextResponse.json({
      success: true,
      message: 'Product schema is up to date',
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to update schema', status: 500, cause: error });
  }
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
