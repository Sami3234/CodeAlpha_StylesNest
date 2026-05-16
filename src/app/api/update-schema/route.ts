import { NextResponse } from 'next/server';
import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to update database schema (products columns).
 */
export async function GET() {
  try {
    await ensureProductSchema();

    return NextResponse.json({ 
      success: true, 
      message: 'Product schema is up to date (pricing_tiers, clothes_options, status)' 
    });
  } catch (error) {
    console.error('Failed to update schema:', error);
    return apiErrorResponse({ message: 'Failed to update schema', status: 500, cause: error });
  }
}

export async function POST() {
  return GET();
}

