import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to migrate existing products with default pricing tiers
 * Adds 3 default pricing tiers based on current price:
 * - 1 piece = currentPrice
 * - 2 pieces = currentPrice * 2
 * - 3 pieces = currentPrice * 3
 */
export async function GET() {
  try {
    console.log('Starting pricing tiers migration...');
    
    // Get all products without pricing tiers
    const products = await sql`
      SELECT id, current_price, pricing_tiers
      FROM products
    `;

    let updatedCount = 0;

    for (const product of products) {
      // Check if already has valid pricing tiers
      const tiers = product.pricing_tiers;
      const hasTiers = tiers && 
                       Array.isArray(tiers) && 
                       tiers.length > 0;
      
      if (hasTiers) {
        console.log(`Product ${product.id} already has pricing tiers, skipping...`);
        continue;
      }
      
      // Also skip if it's an object with properties (not empty)
      if (tiers && typeof tiers === 'object' && !Array.isArray(tiers) && Object.keys(tiers).length > 0) {
        console.log(`Product ${product.id} has non-array pricing data, skipping...`);
        continue;
      }

      const currentPrice = parseFloat(String(product.current_price || 0));
      
      if (isNaN(currentPrice) || currentPrice <= 0) {
        console.log(`Product ${product.id} has invalid price (${product.current_price}), skipping...`);
        continue;
      }
      
      // Create default pricing tiers
      const defaultTiers = [
        { quantity: 1, price: currentPrice, discount: 0 },
        { quantity: 2, price: currentPrice * 2, discount: 0 },
        { quantity: 3, price: currentPrice * 3, discount: 0 },
      ];

      // Update product with pricing tiers
      await sql`
        UPDATE products
        SET pricing_tiers = ${JSON.stringify(defaultTiers)}
        WHERE id = ${product.id}
      `;

      updatedCount++;
      console.log(`Updated product ${product.id} with default pricing tiers`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updatedCount} products with default pricing tiers`,
      totalProducts: products.length,
      updatedCount,
      skipped: products.length - updatedCount,
    });
  } catch (error) {
    console.error('Pricing migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Pricing migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

