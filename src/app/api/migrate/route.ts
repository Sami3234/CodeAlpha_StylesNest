import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { products as initialProducts } from '@/data/products';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to migrate initial products data to database
 * This will populate the database with the initial products
 */
export async function GET() {
  try {
    console.log('Starting migration...');
    
    // Check if products already exist
    const existingProducts = await sql`SELECT COUNT(*) as count FROM products`;
    const count = existingProducts[0]?.count || 0;
    
    if (count > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Database already has ${count} products. Migration skipped to prevent duplicates.`,
        count: Number(count)
      });
    }

    // Migrate initial products
    let migratedCount = 0;
    
    for (const product of initialProducts) {
      try {
        await sql`
          INSERT INTO products (
            id,
            title_en,
            title_ar,
            description_en,
            description_ar,
            current_price,
            original_price,
            discount,
            image,
            images,
            free_delivery,
            sold_count,
            category,
            features_en,
            features_ar,
            status
          )
          VALUES (
            ${product.id},
            ${product.title.en},
            ${product.title.ar},
            ${product.description.en},
            ${product.description.ar},
            ${product.currentPrice},
            ${product.originalPrice},
            ${product.discount},
            ${product.image},
            ${JSON.stringify(product.images || [])},
            ${product.freeDelivery},
            ${product.soldCount},
            ${product.category},
            ${JSON.stringify(product.features?.en || [])},
            ${JSON.stringify(product.features?.ar || [])},
            ${product.status || 'active'}
          )
        `;
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate product ${product.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${migratedCount} products to database`,
      migratedCount 
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

