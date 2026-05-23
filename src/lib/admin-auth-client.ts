import { clientFetch } from '@/lib/client-fetch';

const ADMIN_AUTH_CACHE_KEY = 'sn_admin_auth_v1';
const ADMIN_AUTH_CACHE_MS = 15 * 60 * 1000;

export function readAdminAuthCache(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_CACHE_KEY);
    if (!raw) return false;
    const { ok, at } = JSON.parse(raw) as { ok: boolean; at: number };
    return ok && Date.now() - at < ADMIN_AUTH_CACHE_MS;
  } catch {
    return false;
  }
}

export function writeAdminAuthCache(ok: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (ok) {
      sessionStorage.setItem(ADMIN_AUTH_CACHE_KEY, JSON.stringify({ ok: true, at: Date.now() }));
    } else {
      sessionStorage.removeItem(ADMIN_AUTH_CACHE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearAdminAuthCache(): void {
  writeAdminAuthCache(false);
}

/** Middleware already requires this cookie on protected /khanadmin routes. */
export function hasAdminSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)admin_session=/.test(document.cookie);
}

export function canTrustAdminSessionLocally(): boolean {
  return readAdminAuthCache() || hasAdminSessionCookie();
}

let authCheckInFlight: Promise<boolean> | null = null;

/** Client-side check — uses /api/admin/auth (200 + authenticated flag, never 401). */
export async function fetchAdminAuthenticated(): Promise<boolean> {
  try {
    const response = await clientFetch('/api/admin/auth', { cache: 'no-store' });
    if (!response.ok) return false;
    const data = (await response.json()) as { authenticated?: boolean };
    const ok = Boolean(data.authenticated);
    writeAdminAuthCache(ok);
    return ok;
  } catch {
    return false;
  }
}

/**
 * One auth check per tick — uses session cache and dedupes parallel callers
 * (OrderProvider live polls used to hit /api/admin/auth 4+ times at once).
 */
export function ensureAdminAuthenticated(): Promise<boolean> {
  if (readAdminAuthCache()) {
    return Promise.resolve(true);
  }
  if (authCheckInFlight) {
    return authCheckInFlight;
  }
  authCheckInFlight = fetchAdminAuthenticated().finally(() => {
    authCheckInFlight = null;
  });
  return authCheckInFlight;
}
