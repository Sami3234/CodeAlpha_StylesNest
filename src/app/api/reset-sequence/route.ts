import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiErrorResponse } from '@/lib/safe-errors';
import { requireAdminSession } from '@/lib/require-admin-session';

export const dynamic = 'force-dynamic';

/** Reset product ID sequence (admin only). */
export async function GET(request: NextRequest) {
  const admin = await requireAdminSession(request);
  if (!admin.ok) return admin.response;

  try {
    const result = await sql`SELECT MAX(id) as max_id FROM products`;
    const maxId = result[0]?.max_id || 0;
    const nextId = Number(maxId) + 1;

    await sql`SELECT setval('products_id_seq', ${nextId}, false)`;

    return NextResponse.json({
      success: true,
      message: `Sequence reset. Next product ID will be ${nextId}`,
      maxId,
      nextId,
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to reset sequence', status: 500, cause: error });
  }
}
