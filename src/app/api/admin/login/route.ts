import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiErrorResponse } from '@/lib/safe-errors';
import { createAdminSession, purgeExpiredAdminSessions } from '@/lib/admin-session';
import { hashAdminPassword, verifyAdminPassword } from '@/lib/admin-password';
import { isLoginRateLimited, recordLoginAttempt } from '@/lib/admin-login-rate-limit';
import { logAdminAction } from '@/lib/admin-audit';

export const dynamic = 'force-dynamic';

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const ip = clientIp(request);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const rate = await isLoginRateLimited(normalizedEmail, ip);
    if (rate.limited) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${rate.retryAfterMinutes ?? 15} minutes.`,
        },
        { status: 429 },
      );
    }

    const result = await sql`
      SELECT id, email, password FROM admin WHERE LOWER(TRIM(email)) = ${normalizedEmail} LIMIT 1
    `;

    if (result.length === 0) {
      await recordLoginAttempt(normalizedEmail, ip, false);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const admin = result[0];
    const verified = await verifyAdminPassword(String(password), String(admin.password));

    if (!verified.ok) {
      await recordLoginAttempt(normalizedEmail, ip, false);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (verified.needsUpgrade) {
      const upgraded = await hashAdminPassword(String(password));
      await sql`
        UPDATE admin
        SET password = ${upgraded}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${admin.id}
      `;
    }

    await recordLoginAttempt(normalizedEmail, ip, true);
    await purgeExpiredAdminSessions();
    const sessionToken = await createAdminSession(Number(admin.id));

    await logAdminAction({
      adminId: Number(admin.id),
      adminEmail: String(admin.email),
      action: 'admin.login',
      ip,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to login', status: 500, cause: error });
  }
}
