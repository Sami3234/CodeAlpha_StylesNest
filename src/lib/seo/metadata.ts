import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl, siteConfig, truncate } from '@/lib/seo/site';

type PageSeoInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string | null;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path = '/',
  keywords = [],
  image,
  noIndex = false,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl(siteConfig.defaultOgImagePath);
  const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description: truncate(description, 160),
    keywords: [...siteConfig.keywords, ...keywords],
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description: truncate(description, 200),
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: truncate(description, 200),
      images: [ogImage],
    },
  };
}

export const rootMetadata: Metadata = {
  ...buildPageMetadata({
    title: siteConfig.title,
    description: siteConfig.description,
    path: '/',
  }),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: getSiteUrl() }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
};
