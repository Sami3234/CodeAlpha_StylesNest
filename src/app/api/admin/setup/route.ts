import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiErrorResponse } from '@/lib/safe-errors';
import { hashAdminPassword } from '@/lib/admin-password';

/**
 * Setup endpoint to create initial admin account
 * POST /api/admin/setup
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      );
    }

    const existingAdmin = await sql`SELECT id FROM admin LIMIT 1`;

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { error: 'Admin account already exists. Use login instead.' },
        { status: 400 },
      );
    }

    const hashedPassword = await hashAdminPassword(String(password));

    await sql`
      INSERT INTO admin (email, password)
      VALUES (${String(email).trim().toLowerCase()}, ${hashedPassword})
    `;

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    const errorCode = (error as { code?: string })?.code;

    if (errorCode === '23505' || errorMessage?.includes('unique')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    return apiErrorResponse({ message: 'Failed to create admin account', status: 500, cause: error });
  }
}
