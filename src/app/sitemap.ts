import type { MetadataRoute } from 'next';
import { legalPagePaths } from '@/lib/legal-pages-types';
import { getActiveProductsForSitemap } from '@/lib/seo/products-for-sitemap';
import { getSiteUrl, shopCategories } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_BASE = 'https://www.stylesnest.store';

function safeDate(value: Date | string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function staticEntries(base: string, now: Date): MetadataRoute.Sitemap {
  const legal = legalPagePaths.map((page) => ({
    url: `${base}${page.path}`,
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...legal,
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  let base = FALLBACK_BASE;

  try {
    base = getSiteUrl();
  } catch {
    /* use fallback */
  }

  const staticPages = staticEntries(base, now);

  if (!process.env.DATABASE_URL) {
    return staticPages;
  }

  try {
    const categoryPages: MetadataRoute.Sitemap = shopCategories
      .filter((cat) => cat.slug !== 'all')
      .map((cat) => ({
        url: `${base}/shop?category=${cat.slug}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.85,
      }));

    const products = await getActiveProductsForSitemap();
    const productPages: MetadataRoute.Sitemap = products
      .filter((p) => Number.isFinite(p.id) && p.id > 0)
      .map((p) => ({
        url: `${base}/product/${p.id}`,
        lastModified: safeDate(p.updated_at, now),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    return [...staticPages, ...categoryPages, ...productPages];
  } catch (error) {
    console.error('[sitemap] generation failed, returning static URLs only:', error);
    return staticPages;
  }
}
