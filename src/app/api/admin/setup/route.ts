import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Setup endpoint to create initial admin account
 * This should only be called once to create the first admin
 * POST /api/admin/setup
 * Body: { email: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await sql`
      SELECT id FROM admin LIMIT 1
    `;

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { error: 'Admin account already exists. Use login instead.' },
        { status: 400 }
      );
    }

    // Create admin account
    const hashedPassword = hashPassword(password);
    
    await sql`
      INSERT INTO admin (email, password)
      VALUES (${email}, ${hashedPassword})
    `;

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
    });
  } catch (error) {
    console.error('Setup error:', error);
    
    // Handle unique constraint violation
    const errorMessage = error instanceof Error ? error.message : '';
    const errorCode = (error as { code?: string })?.code;
    
    if (errorCode === '23505' || errorMessage?.includes('unique')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
