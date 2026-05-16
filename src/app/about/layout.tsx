import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'About Us & Contact',
  description:
    'Learn about StylesNest — your trusted online store in Pakistan. Contact us via WhatsApp, phone or email. Free delivery and cash on delivery available.',
  path: '/about',
  keywords: ['StylesNest about', 'contact StylesNest', 'online store Pakistan'],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
