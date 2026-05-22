import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { apiErrorResponse } from '@/lib/safe-errors';
import { listShopUsers } from '@/lib/shop-users';
import { providerLabel } from '@/lib/shop-users-labels';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const users = await listShopUsers();
    const blocked = users.filter((u) => u.is_blocked).length;

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        phone: u.phone,
        city: u.city,
        provider: u.provider,
        providerLabel: providerLabel(u.provider),
        isBlocked: u.is_blocked,
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at,
      })),
      stats: {
        total: users.length,
        active: users.length - blocked,
        blocked,
      },
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to load users', status: 500, cause: error });
  }
}
