import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl, siteConfig, truncate } from '@/lib/seo/site';

const logoUrl = absoluteUrl(siteConfig.logoPath);

const brandIcons = [
  { url: logoUrl, type: 'image/png', sizes: '48x48' },
  { url: logoUrl, type: 'image/png', sizes: '96x96' },
  { url: logoUrl, type: 'image/png', sizes: '192x192' },
  { url: logoUrl, type: 'image/png', sizes: '512x512' },
] as const;

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
  const pageTitle = title.includes(siteConfig.name)
    ? { absolute: title }
    : title;

  return {
    title: pageTitle,
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
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      ...brandIcons,
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/favicon/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
    other: [{ rel: 'mask-icon', url: logoUrl, color: '#1e293b' }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    'geo.region': siteConfig.region,
    'geo.placename': siteConfig.country,
    'msapplication-TileImage': absoluteUrl(siteConfig.logoPath),
  },
};
