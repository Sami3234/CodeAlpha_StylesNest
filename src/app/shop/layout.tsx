import type { Metadata } from 'next';
import '@/components/seo/seo-crawl.css';
import JsonLd from '@/components/seo/JsonLd';
import ShopSeoContent from '@/components/seo/ShopSeoContent';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo/json-ld-builders';
import { getProductsForCrawl } from '@/lib/seo/products-for-crawl';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shop All Products',
  description:
    'Browse cosmetics, electronics, clothes, jewelry, watches, bags, men fashion and general store items. Free delivery across Pakistan.',
  path: '/shop',
  keywords: ['shop online Pakistan', 'StylesNest shop', 'all categories'],
});

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const products = await getProductsForCrawl();

  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' },
    ]),
    itemListJsonLd(products),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <ShopSeoContent products={products} />
      {children}
    </>
  );
}
