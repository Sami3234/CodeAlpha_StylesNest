import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiErrorResponse } from '@/lib/safe-errors';
import { requireAdminSession } from '@/lib/require-admin-session';

export const dynamic = 'force-dynamic';

/**
 * Update sold count for products with 0 or very low sales
 * Sets random 3-digit numbers (100-999)
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdminSession(request);
  if (!admin.ok) return admin.response;

  try {
    console.log('Updating sold counts...');
    
    // Get products with low/zero sold count
    const products = await sql`
      SELECT id, title_en, sold_count
      FROM products
    `;

    let updatedCount = 0;

    for (const product of products) {
      // Generate random sold count between 100-999
      const randomSoldCount = Math.floor(Math.random() * 900) + 100;
      
      await sql`
        UPDATE products
        SET sold_count = ${randomSoldCount}
        WHERE id = ${product.id}
      `;

      updatedCount++;
      console.log(`Product ${product.id} (${product.title_en.substring(0, 30)}): ${randomSoldCount} items sold`);
    }

    return NextResponse.json({
      success: true,
      message: `Updated sold count for ${updatedCount} products`,
      updatedCount,
    });
  } catch (error) {
    console.error('Failed to update sold counts:', error);
    return apiErrorResponse({ message: 'Failed to update sold counts', status: 500, cause: error });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

