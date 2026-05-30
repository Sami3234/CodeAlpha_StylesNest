import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import HomeSeoContent from '@/components/seo/HomeSeoContent';
import JsonLd from '@/components/seo/JsonLd';
import { getLandingImagesBySection } from '@/lib/landing-images-query';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { trendingProductsJsonLd } from '@/lib/seo/json-ld-builders';
import { absoluteUrl, siteConfig } from '@/lib/seo/site';
import { getContactForSchema } from '@/lib/seo/contact-for-schema';
import { getTrendingProductsForSchema } from '@/lib/seo/trending-for-schema';
import { SEO_TRENDING_IMAGE_COUNT } from '@/lib/trending-products';

/** Always read latest trending list from DB (not a stale build snapshot). */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const trending = await getTrendingProductsForSchema(SEO_TRENDING_IMAGE_COUNT);
  const base = buildPageMetadata({
    title: siteConfig.title,
    description: siteConfig.description,
    path: '/',
    image: siteConfig.logoPath,
    keywords: ['all in one place', 'trending products Pakistan', 'StylesNest Facebook'],
  });

  const ogImages = [
    {
      url: absoluteUrl(siteConfig.defaultOgImagePath),
      width: 512,
      height: 512,
      alt: `${siteConfig.name} logo`,
    },
    ...trending.map((p) => ({
      url: p.imageUrl,
      width: 800,
      height: 800,
      alt: p.name,
    })),
  ];

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: ogImages,
    },
    twitter: {
      ...base.twitter,
      images: ogImages.map((img) => img.url),
    },
  };
}

export default async function HomePage() {
  const [initialLandingImages, trendingProducts, contact] = await Promise.all([
    getLandingImagesBySection(),
    getTrendingProductsForSchema(SEO_TRENDING_IMAGE_COUNT),
    getContactForSchema(),
  ]);

  const initialHeroSlides = (initialLandingImages.hero || [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 4);

  const jsonLd = trendingProducts.length > 0 ? [trendingProductsJsonLd(trendingProducts)] : [];

  return (
    <>
      {jsonLd.length > 0 ? <JsonLd data={jsonLd} /> : null}
      <HomePageClient
        initialLandingImages={initialLandingImages}
        initialHeroSlides={initialHeroSlides}
      />
      <HomeSeoContent trendingProducts={trendingProducts} socialLinks={contact.sameAs} />
    </>
  );
}
