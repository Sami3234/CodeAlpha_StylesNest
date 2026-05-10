import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to update database schema
 * Adds pricing_tiers column to existing products table
 */
export async function GET() {
  try {
    console.log('Adding pricing_tiers column...');
    
    // Add pricing_tiers column if it doesn't exist
    await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '[]'
    `;

    console.log('Schema updated successfully!');
    return NextResponse.json({ 
      success: true, 
      message: 'Schema updated successfully - pricing_tiers column added' 
    });
  } catch (error) {
    console.error('Failed to update schema:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

