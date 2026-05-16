import { NextRequest, NextResponse } from 'next/server';
import { listShopUsers } from '@/lib/shop-users';
import { providerLabel } from '@/lib/shop-users-labels';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await listShopUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        provider: u.provider,
        providerLabel: providerLabel(u.provider),
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at,
      })),
    });
  } catch (error) {
    console.error('shop-users list error:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
