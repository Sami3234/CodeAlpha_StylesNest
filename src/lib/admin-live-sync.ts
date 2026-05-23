/** How often admin panel refreshes orders/products while logged in (ms). */
/** Admin background refresh interval — keep moderate to avoid Neon connection storms. */
export const ADMIN_LIVE_POLL_MS = 30_000;

/** Parse `?since=` from admin live polls; invalid values → null (full snapshot). */
export function parseAdminLiveSince(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw.trim());
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getTime() - 15_000);
}
