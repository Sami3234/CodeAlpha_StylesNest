import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateAdminSession } from '@/lib/admin-session';

export type AdminSessionResult =
  | { ok: true; adminId: number; email: string }
  | { ok: false; response: NextResponse };

/** Verify admin panel session cookie against the database. */
export async function requireAdminSession(
  request: NextRequest,
  options?: { touch?: boolean },
): Promise<AdminSessionResult> {
  const token = request.cookies.get('admin_session')?.value;
  const session = await validateAdminSession(token, options);

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true, adminId: session.adminId, email: session.email };
}

/** True when a valid admin session cookie is present (e.g. public GET with full catalog). */
export async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_session')?.value;
  const session = await validateAdminSession(token);
  return session !== null;
}
