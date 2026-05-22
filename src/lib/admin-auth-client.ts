import { clientFetch } from '@/lib/client-fetch';

/** Client-side check — uses /api/admin/auth (200 + authenticated flag, never 401). */
export async function fetchAdminAuthenticated(): Promise<boolean> {
  try {
    const response = await clientFetch('/api/admin/auth', { cache: 'no-store' });
    if (!response.ok) return false;
    const data = (await response.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}
