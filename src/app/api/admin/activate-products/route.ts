import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

/**
 * Set all inactive products to active (admin recovery after schema fixes).
 */
export async function POST() {
  try {
    await ensureProductSchema();

    const result = await sql`
      UPDATE products
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'inactive'
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      activated: result.length,
      message:
        result.length > 0
          ? `${result.length} product(s) set to active`
          : 'No inactive products found',
    });
  } catch (error) {
    console.error('activate-products error:', error);
    return apiErrorResponse({ message: 'Failed to activate products', status: 500, cause: error });
  }
}
