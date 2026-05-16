import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/init-db';
import { apiErrorResponse } from '@/lib/safe-errors';

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
    return apiErrorResponse({ message: 'Failed to initialize database', status: 500, cause: error });
  }
}

export async function POST() {
  return GET();
}

