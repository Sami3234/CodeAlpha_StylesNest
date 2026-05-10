/**
 * Normalize admin-entered URLs for footer social links.
 * Only allows https (or empty). Blocks javascript:, data:, etc.
 */
export function sanitizeSocialUrl(raw: unknown): string {
  if (raw == null || typeof raw !== 'string') return '';
  let s = raw.trim().slice(0, 512);
  if (!s) return '';
  if (/^\/\//.test(s)) s = `https:${s}`;
  else if (!/^https?:\/\//i.test(s)) s = `https://${s.replace(/^\/+/, '')}`;
  try {
    const url = new URL(s);
    if (url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}
