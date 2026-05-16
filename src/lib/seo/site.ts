/** Central SEO / site identity */

export const siteConfig = {
  name: 'StylesNest',
  title: 'StylesNest — Online Shopping in Pakistan | Free Delivery',
  description:
    'Shop cosmetics, electronics, clothes, jewelry, watches, bags and daily essentials at StylesNest. Great prices and free delivery across Pakistan with cash on delivery.',
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
    'general store online',
  ],
  contactEmail: 'info@stylesnest.com',
  defaultOgImagePath: '/images/general.webp',
} as const;

export const shopCategories = [
  { slug: 'cosmetics', label: 'Cosmetics' },
  { slug: 'jewelry', label: 'Jewelry' },
  { slug: 'watches', label: 'Watches' },
  { slug: 'makeup', label: 'Makeup' },
  { slug: 'clothes', label: 'Clothes' },
  { slug: 'electronics', label: 'Electronics' },
  { slug: 'bags', label: 'Bags' },
  { slug: 'menfashion', label: 'Men Fashion' },
  { slug: 'general', label: 'General Store' },
] as const;

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    'https://stylesnest.com';
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
