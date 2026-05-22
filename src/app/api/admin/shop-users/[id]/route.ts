import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { logAdminAction } from '@/lib/admin-audit';
import { apiErrorResponse } from '@/lib/safe-errors';
import {
  deleteShopUser,
  getShopUserById,
  setShopUserBlocked,
} from '@/lib/shop-users';

export const dynamic = 'force-dynamic';

function parseUserId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

/** Block or unblock a shop user. */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const userId = parseUserId((await context.params).id);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const blocked = body.blocked;
    if (typeof blocked !== 'boolean') {
      return NextResponse.json({ error: 'blocked (boolean) is required' }, { status: 400 });
    }

    const existing = await getShopUserById(userId);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await setShopUserBlocked(userId, blocked);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    await logAdminAction({
      adminId: admin.adminId,
      adminEmail: admin.email,
      action: blocked ? 'shop_user.block' : 'shop_user.unblock',
      entityType: 'shop_user',
      entityId: String(userId),
      details: { email: existing.email, name: existing.name },
      ip: clientIp(request),
    });

    const updated = await getShopUserById(userId);
    return NextResponse.json({ user: updated, blocked });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to update user', status: 500, cause: error });
  }
}

/** Permanently delete a shop user account. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const userId = parseUserId((await context.params).id);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const existing = await getShopUserById(userId);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await deleteShopUser(userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    await logAdminAction({
      adminId: admin.adminId,
      adminEmail: admin.email,
      action: 'shop_user.delete',
      entityType: 'shop_user',
      entityId: String(userId),
      details: { email: existing.email, name: existing.name, provider: existing.provider },
      ip: clientIp(request),
    });

    return NextResponse.json({ deleted: true, id: userId });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to delete user', status: 500, cause: error });
  }
}
