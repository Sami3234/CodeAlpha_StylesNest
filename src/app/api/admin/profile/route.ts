import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdminSession } from '@/lib/require-admin-session';
import { hashAdminPassword, verifyAdminPassword } from '@/lib/admin-password';
import { logAdminAction } from '@/lib/admin-audit';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.adminId,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const { email, password, currentPassword } = await request.json();

    const currentAdmin = await sql`
      SELECT id, email, password FROM admin WHERE id = ${admin.adminId} LIMIT 1
    ` as Array<{ id: number; email: string; password: string }>;

    if (currentAdmin.length === 0) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to update password' },
          { status: 400 },
        );
      }

      const verified = await verifyAdminPassword(
        String(currentPassword),
        currentAdmin[0].password,
      );

      if (!verified.ok) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }

    if (email && password) {
      const hashedPassword = await hashAdminPassword(String(password));
      await sql`
        UPDATE admin
        SET email = ${String(email).trim().toLowerCase()}, password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${admin.adminId}
      `;
    } else if (email) {
      await sql`
        UPDATE admin
        SET email = ${String(email).trim().toLowerCase()}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${admin.adminId}
      `;
    } else if (password) {
      const hashedPassword = await hashAdminPassword(String(password));
      await sql`
        UPDATE admin
        SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${admin.adminId}
      `;
      await logAdminAction({
        adminId: admin.adminId,
        adminEmail: admin.email,
        action: 'admin.password_change',
      });
    } else {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedAdmin = await sql`
      SELECT id, email FROM admin WHERE id = ${admin.adminId}
    ` as Array<{ id: number; email: string }>;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: updatedAdmin[0].id,
        email: updatedAdmin[0].email,
      },
    });
  } catch (error: unknown) {
    console.error('Update profile error:', error);

    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const dbError = error as { code: string; message: string };
      if (dbError.code === '23505' || dbError.message.includes('unique')) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
