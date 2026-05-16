import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { changeShopUserPassword } from '@/lib/shop-users';
import { passwordsMatch, validatePasswordStrength } from '@/lib/password-policy';

export const dynamic = 'force-dynamic';

function parseUserId(sessionUserId: string | undefined): number | null {
  if (!sessionUserId) return null;
  const id = Number(sessionUserId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = parseUserId(session?.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session?.user?.authProvider && session.user.authProvider !== 'credentials') {
      return NextResponse.json(
        { error: 'Password change is only available for email sign-in accounts' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');
    const confirmPassword = String(body.confirmPassword ?? body.confirmNewPassword ?? '');

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    if (!passwordsMatch(newPassword, confirmPassword)) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.errors.join('. ') }, { status: 400 });
    }

    const result = await changeShopUserPassword(userId, { currentPassword, newPassword });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT password error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
