import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shop All Products',
  description:
    'Browse cosmetics, electronics, clothes, jewelry, watches, bags, men fashion and general store items. Free delivery across Pakistan.',
  path: '/shop',
  keywords: ['shop online Pakistan', 'StylesNest shop', 'all categories'],
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
