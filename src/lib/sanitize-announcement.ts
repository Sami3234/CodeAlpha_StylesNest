import { sanitizeSocialUrl } from '@/lib/sanitize-social-url';

/** Plain text only; strips angle-bracket chunks and limits length for top bar. */
export function sanitizeAnnouncementText(raw: unknown): string {
  if (raw == null || typeof raw !== 'string') return '';
  const stripped = raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return stripped.slice(0, 600);
}

/**
 * Customer care link: relative paths, mailto:, tel:, or https (via sanitizeSocialUrl).
 */
export function sanitizeCustomerCareUrl(raw: unknown): string {
  if (raw == null || typeof raw !== 'string') return '';
  const s = raw.trim().slice(0, 512);
  if (!s) return '';
  const lower = s.toLowerCase();
  if (lower.startsWith('mailto:')) {
    try {
      const u = new URL(s);
      if (u.protocol !== 'mailto:') return '';
      return u.href.slice(0, 512);
    } catch {
      return '';
    }
  }
  if (lower.startsWith('tel:')) {
    const rest = s.slice(4).replace(/[^\d+\-\s()]/g, '').trim();
    if (!rest) return '';
    return `tel:${rest.replace(/\s/g, '')}`.slice(0, 64);
  }
  if (s.startsWith('/') && !s.startsWith('//')) {
    return s.replace(/[\r\n<>"]/g, '').slice(0, 256);
  }
  return sanitizeSocialUrl(s);
}
