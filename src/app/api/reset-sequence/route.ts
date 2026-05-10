import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Reset the product ID sequence to continue from the highest existing ID
 * This fixes the "duplicate key" error when adding new products
 */
export async function GET() {
  try {
    console.log('Resetting product ID sequence...');
    
    // Get the maximum ID from products table
    const result = await sql`
      SELECT MAX(id) as max_id FROM products
    `;
    
    const maxId = result[0]?.max_id || 0;
    const nextId = maxId + 1;
    
    console.log(`Current max ID: ${maxId}, setting sequence to: ${nextId}`);
    
    // Reset the sequence to start from next available ID
    await sql`
      SELECT setval('products_id_seq', ${nextId}, false)
    `;
    
    console.log('✅ Sequence reset successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: `Sequence reset successfully. Next product ID will be ${nextId}`,
      maxId: maxId,
      nextId: nextId
    });
  } catch (error) {
    console.error('Error resetting sequence:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset sequence',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

