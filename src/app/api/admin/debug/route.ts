import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Debug endpoint to check admin data in database
 * This helps troubleshoot login issues
 */
export async function GET() {
  try {
    // Get all admins
    const admins = await sql`
      SELECT id, email, password, created_at, updated_at FROM admin
    `;

    // Return admin data (without exposing full password, just show first few chars)
    const safeAdmins = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      passwordHash: admin.password ? `${admin.password.substring(0, 10)}...` : 'NULL',
      passwordLength: admin.password ? admin.password.length : 0,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
    }));

    return NextResponse.json({
      success: true,
      adminCount: admins.length,
      admins: safeAdmins,
      note: 'If password length is not 64 characters, it is not properly hashed. SHA-256 hash should be 64 characters long.',
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Test password hashing
 * POST with { password: "test123" } to see the hash
 */
export async function POST(request: NextRequest) {
  try {
    const { password, email } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    let adminData = null;
    if (email) {
      const result = await sql`
        SELECT id, email, password FROM admin WHERE email = ${email} LIMIT 1
      `;
      if (result.length > 0) {
        adminData = {
          email: result[0].email,
          storedPasswordHash: result[0].password,
          storedPasswordLength: result[0].password?.length || 0,
          providedPasswordHash: hashedPassword,
          match: result[0].password === hashedPassword,
        };
      }
    }

    return NextResponse.json({
      success: true,
      providedPassword: password,
      hashedPassword: hashedPassword,
      hashLength: hashedPassword.length,
      adminData,
    });
  } catch (error) {
    console.error('Debug POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
