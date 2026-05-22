import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_BASE, adminPath, isPublicAdminPath, normalizeAdminPathname } from '@/lib/admin-path';

export function middleware(request: NextRequest) {
  const pathname = normalizeAdminPathname(request.nextUrl.pathname);

  if (!pathname.startsWith(ADMIN_BASE)) {
    return NextResponse.next();
  }

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_session')?.value;
  if (!token?.trim()) {
    const loginUrl = new URL(adminPath('/login'), request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/khanadmin/:path*'],
};
