import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function requireShopSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: 'Login required to place an order' }, { status: 401 }) };
  }
  return { session, error: null };
}
