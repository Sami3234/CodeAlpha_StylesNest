import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getShopUserProfile, updateShopUserProfile } from '@/lib/shop-users';

export const dynamic = 'force-dynamic';

function parseUserId(sessionUserId: string | undefined): number | null {
  if (!sessionUserId) return null;
  const id = Number(sessionUserId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = parseUserId(session?.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getShopUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        fullName: profile.fullName,
        phone: profile.phone,
        city: profile.city,
        address: profile.address,
        email: profile.email,
      },
    });
  } catch (error) {
    console.error('GET profile error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = parseUserId(session?.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await updateShopUserProfile(userId, {
      fullName: String(body.fullName ?? ''),
      phone: String(body.phone ?? body.mobile ?? ''),
      city: String(body.city ?? ''),
      address: String(body.address ?? ''),
      email: session?.user?.email ?? null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const profile = await getShopUserProfile(userId);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('PUT profile error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
