import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isShopUserBlocked } from '@/lib/shop-users';

export async function requireShopSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: 'Login required to place an order' }, { status: 401 }) };
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId) || (await isShopUserBlocked(userId))) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Your account has been suspended. Please contact StylesNest support.' },
        { status: 403 },
      ),
    };
  }

  return { session, error: null };
}
