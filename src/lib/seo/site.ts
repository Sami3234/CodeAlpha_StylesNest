import { SITE_CONTACT } from '@/lib/site-contact';

/** Central SEO / site identity — used by metadata, sitemap, and JSON-LD */

export const siteConfig = {
  name: 'StylesNest',
  legalName: 'StylesNest',
  title: 'StylesNest — Fashion for Men, Women & Kids | All in One Place',
  description:
    'StylesNest is your all-in-one online store in Pakistan — cosmetics, clothes, jewelry, watches, shoes, electronics, bags & men fashion. Free delivery on eligible orders, cash on delivery nationwide.',
  phone: SITE_CONTACT.phone,
  address: SITE_CONTACT.address,
  locale: 'en_PK',
  language: 'en',
  country: 'Pakistan',
  region: 'PK',
  keywords: [
    'StylesNest',
    'online shopping Pakistan',
    'buy online Pakistan',
    'cosmetics Pakistan',
    'electronics online Pakistan',
    'clothes online Pakistan',
    'jewelry Pakistan',
    'watches online',
    'free delivery Pakistan',
    'cash on delivery',
    'COD Pakistan',
    'imported cosmetics',
    'men fashion Pakistan',
    'women fashion Pakistan',
    'all in one place shopping Pakistan',
    'general store online',
  ],
  twitterHandle: '@stylesnest',
  contactEmail: SITE_CONTACT.email,
  /** Large logo for Open Graph / social previews */
  logoPath: '/StylesNest_Nest.png',
  defaultOgImagePath: '/StylesNest_Nest.png',
  /** Browser tab & PWA icons (public/favicon/) */
  faviconIco: '/favicon/favicon.ico',
  favicon16: '/favicon/favicon-16x16.png',
  favicon32: '/favicon/favicon-32x32.png',
  appleTouchIcon: '/favicon/apple-touch-icon.png',
  pwaIcon192: '/favicon/android-chrome-192x192.png',
  pwaIcon512: '/favicon/android-chrome-512x512.png',
} as const;

export const shopCategories = [
  { slug: 'all', label: 'All Products' },
  { slug: 'cosmetics', label: 'Cosmetics' },
  { slug: 'jewelry', label: 'Jewelry' },
  { slug: 'watches', label: 'Watches' },
  { slug: 'makeup', label: 'Makeup' },
  { slug: 'clothes', label: 'Clothes' },
  { slug: 'shoes', label: 'Shoes' },
  { slug: 'electronics', label: 'Electronics' },
  { slug: 'bags', label: 'Bags' },
  { slug: 'menfashion', label: 'Men Fashion' },
  { slug: 'general', label: 'General Store' },
] as const;

/** Public site URL — set NEXT_PUBLIC_SITE_URL in production (e.g. https://stylesnest.com) */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    'https://www.stylesnest.store';
  return raw.replace(/\/$/, '');
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}
