import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to initialize database tables
 * Call this once to set up your database schema
 */
export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

