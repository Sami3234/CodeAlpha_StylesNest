import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { hashAdminPassword } from '@/lib/admin-password';

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Emergency admin password reset when you forgot the password.
 * NOT for recovering the old password (impossible with SHA-256).
 *
 * 1. Add to `.env.local` (or host env): ADMIN_RESET_TOKEN=<long random string, 32+ chars>
 * 2. Restart the app
 * 3. POST once:
 *    curl -X POST http://localhost:3000/api/admin/emergency-reset-password \
 *      -H "Content-Type: application/json" \
 *      -d '{"resetToken":"YOUR_TOKEN","newPassword":"YourNewPass123"}'
 * 4. Remove ADMIN_RESET_TOKEN from env after use
 *
 * Optional: `"email":"admin@..."` if multiple admin rows and you want to target one.
 */
export async function POST(request: NextRequest) {
  try {
    const expected = process.env.ADMIN_RESET_TOKEN?.trim();
    if (!expected || expected.length < 32) {
      return NextResponse.json(
        {
          error:
            'ADMIN_RESET_TOKEN is not set or too short. Add a secret of at least 32 characters to your environment, restart the server, then call this endpoint again.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const resetToken = typeof body.resetToken === 'string' ? body.resetToken : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const targetEmail =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!timingSafeEqualStr(resetToken, expected)) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 401 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'newPassword is required and must be at least 6 characters' },
        { status: 400 }
      );
    }

    const hashed = await hashAdminPassword(newPassword);

    if (targetEmail) {
      const updated = await sql`
        UPDATE admin
        SET password = ${hashed}, updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(TRIM(email)) = ${targetEmail}
        RETURNING id, email
      `;
      if (updated.length === 0) {
        return NextResponse.json(
          { error: 'No admin found with that email' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Password updated',
        email: updated[0].email,
      });
    }

    const updated = await sql`
      UPDATE admin
      SET password = ${hashed}, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM admin ORDER BY id ASC LIMIT 1)
      RETURNING id, email
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'No admin row found. Use /api/admin/setup first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated for the first admin account',
      email: updated[0].email,
    });
  } catch (error) {
    console.error('Emergency reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
