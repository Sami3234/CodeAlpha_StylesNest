import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Update sold count for products with 0 or very low sales
 * Sets random 3-digit numbers (100-999)
 */
export async function GET() {
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update sold counts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

