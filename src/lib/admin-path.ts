/** Obfuscated admin panel URL (do not link publicly). */
export const ADMIN_BASE = '/khanadmin';

/** Legacy path — shows site 404 UI; panel lives at ADMIN_BASE. */
export const LEGACY_ADMIN_BASE = '/admin';

/** Strip trailing slash so `/khanadmin/login/` matches login. */
export function normalizeAdminPathname(pathname: string | null | undefined): string {
  if (!pathname) return '';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function adminPath(subpath = ''): string {
  if (!subpath || subpath === '/') return ADMIN_BASE;
  const normalized = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${ADMIN_BASE}${normalized}`;
}

export function isAdminPanelPath(pathname: string | null | undefined): boolean {
  const p = normalizeAdminPathname(pathname);
  if (!p) return false;
  return p === ADMIN_BASE || p.startsWith(`${ADMIN_BASE}/`);
}

export function isPublicAdminPath(pathname: string | null | undefined): boolean {
  const p = normalizeAdminPathname(pathname);
  if (!p) return false;
  return p === adminPath('/login') || p === adminPath('/setup');
}

/** Admin routes that require a logged-in session (excludes login/setup). */
export function isProtectedAdminPanelPath(pathname: string | null | undefined): boolean {
  if (!isAdminPanelPath(pathname)) return false;
  return !isPublicAdminPath(pathname);
}

export function isLegacyAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === LEGACY_ADMIN_BASE || pathname.startsWith(`${LEGACY_ADMIN_BASE}/`);
}
