import type { MetadataRoute } from 'next';
import { getSiteUrl, siteConfig } from '@/lib/seo/site';

export default function manifest(): MetadataRoute.Manifest {
  const base = getSiteUrl();

  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f5f5',
    theme_color: '#1e293b',
    lang: siteConfig.language,
    icons: [
      {
        src: siteConfig.logoPath,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: siteConfig.logoPath,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    id: `${base}/`,
  };
}
