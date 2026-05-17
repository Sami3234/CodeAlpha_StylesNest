/** Obfuscated admin panel URL (do not link publicly). */
export const ADMIN_BASE = '/khanadmin';

/** Legacy path — shows site 404 UI; panel lives at ADMIN_BASE. */
export const LEGACY_ADMIN_BASE = '/admin';

export function adminPath(subpath = ''): string {
  if (!subpath || subpath === '/') return ADMIN_BASE;
  const normalized = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${ADMIN_BASE}${normalized}`;
}

export function isAdminPanelPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === ADMIN_BASE || pathname.startsWith(`${ADMIN_BASE}/`);
}

export function isPublicAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === adminPath('/login') || pathname === adminPath('/setup');
}

export function isLegacyAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === LEGACY_ADMIN_BASE || pathname.startsWith(`${LEGACY_ADMIN_BASE}/`);
}
