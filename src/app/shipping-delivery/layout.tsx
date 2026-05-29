import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shipping & Delivery',
  description:
    'StylesNest shipping and delivery information — coverage across Pakistan, delivery times, and free delivery eligibility.',
  path: '/shipping-delivery',
  keywords: ['shipping Pakistan', 'free delivery', 'StylesNest delivery'],
});

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
