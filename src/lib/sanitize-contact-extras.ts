import {
  sanitizeAnnouncementText,
  sanitizeCustomerCareUrl,
} from '@/lib/sanitize-announcement';

export const DEFAULT_FOOTER_SERVICES = [
  'Free Delivery',
  'Cash on Delivery',
  'Genuine Products',
  '24/7 Support',
] as const;

const MAX_SERVICES = 8;
const MAX_SERVICE_LEN = 120;
const MAX_TOP_LINKS = 4;

/** Footer “Services” bullets — plain text lines */
export function sanitizeFooterServices(raw: unknown): string[] {
  let arr: unknown[];
  if (raw == null) return [...DEFAULT_FOOTER_SERVICES];
  if (typeof raw === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [...DEFAULT_FOOTER_SERVICES];
    }
    if (!Array.isArray(parsed)) return [...DEFAULT_FOOTER_SERVICES];
    arr = parsed;
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    return [...DEFAULT_FOOTER_SERVICES];
  }

  const out: string[] = [];
  for (const item of arr.slice(0, MAX_SERVICES)) {
    if (typeof item !== 'string') continue;
    const s = sanitizeAnnouncementText(item).slice(0, MAX_SERVICE_LEN);
    if (s) out.push(s);
  }
  return out.length > 0 ? out : [...DEFAULT_FOOTER_SERVICES];
}

/**
 * Up to 4 URLs on the orange top bar only (relative paths or https).
 * Legacy stored JSON: [{ label, url }] — URL is still applied; label ignored.
 */
export function sanitizeTopBarUrls(raw: unknown): string[] {
  let arr: unknown[];
  if (raw == null) return [];
  if (typeof raw === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];
    arr = parsed;
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    return [];
  }

  const out: string[] = [];
  for (const entry of arr.slice(0, MAX_TOP_LINKS)) {
    if (typeof entry === 'string') {
      const u = sanitizeCustomerCareUrl(entry);
      if (u) out.push(u);
      continue;
    }
    if (entry && typeof entry === 'object') {
      const o = entry as Record<string, unknown>;
      const u = sanitizeCustomerCareUrl(o.url);
      if (u) out.push(u);
    }
  }
  return out;
}

/** Short caption for top-bar link text (URLs only in admin). */
export function topBarUrlCaption(href: string): string {
  const h = href.trim();
  if (!h) return '';
  if (h.startsWith('/') && !h.startsWith('//')) {
    const parts = h.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    const word = last.replace(/-/g, ' ');
    return word ? word.charAt(0).toUpperCase() + word.slice(1) : 'Home';
  }
  try {
    const u = new URL(h);
    let s = u.hostname.replace(/^www\./i, '');
    if (u.pathname && u.pathname !== '/') {
      s += u.pathname.replace(/\/$/, '');
    }
    return s.length > 36 ? `${s.slice(0, 33)}…` : s;
  } catch {
    return 'Link';
  }
}

export function footerServicesToJson(services: string[]): string {
  return JSON.stringify(services);
}

export function topBarUrlsToJson(urls: string[]): string {
  return JSON.stringify(urls);
}
