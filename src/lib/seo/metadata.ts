import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl, siteConfig, truncate } from '@/lib/seo/site';

const favicon512Url = absoluteUrl(siteConfig.pwaIcon512);
const favicon32Url = absoluteUrl(siteConfig.favicon32);

type PageSeoInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string | null;
  noIndex?: boolean;
  type?: 'website' | 'article';
};

export function buildPageMetadata({
  title,
  description,
  path = '/',
  keywords = [],
  image,
  noIndex = false,
  type = 'website',
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl(siteConfig.defaultOgImagePath);
  const displayTitle = title.includes(siteConfig.name)
    ? title
    : `${title} | ${siteConfig.name}`;

  return {
    title: { absolute: displayTitle },
    description: truncate(description, 155),
    keywords: [...siteConfig.keywords, ...keywords],
    metadataBase: new URL(getSiteUrl()),
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type,
      locale: siteConfig.locale.replace('_', '-'),
      url,
      siteName: siteConfig.name,
      title: displayTitle,
      description: truncate(description, 200),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: displayTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: truncate(description, 200),
      images: [ogImage],
    },
    category: 'shopping',
  };
}

export const rootMetadata: Metadata = {
  ...buildPageMetadata({
    title: siteConfig.title,
    description: siteConfig.description,
    path: '/',
    image: siteConfig.logoPath,
  }),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: getSiteUrl() }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  icons: {
    icon: [
      { url: siteConfig.faviconIco, sizes: 'any' },
      { url: siteConfig.favicon16, type: 'image/png', sizes: '16x16' },
      { url: siteConfig.favicon32, type: 'image/png', sizes: '32x32' },
    ],
    shortcut: [siteConfig.faviconIco],
    apple: [
      {
        url: siteConfig.appleTouchIcon,
        type: 'image/png',
        sizes: '180x180',
      },
    ],
    other: [{ rel: 'mask-icon', url: favicon32Url, color: '#1e293b' }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    'geo.region': siteConfig.region,
    'geo.placename': siteConfig.country,
    'msapplication-TileImage': favicon512Url,
  },
};
