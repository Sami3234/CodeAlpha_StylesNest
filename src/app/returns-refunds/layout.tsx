import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Returns & Refunds',
  description:
    'StylesNest returns and refunds policy — how to request a return, exchange, or refund for your order in Pakistan.',
  path: '/returns-refunds',
  keywords: ['returns policy', 'refund', 'exchange', 'StylesNest returns'],
});

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
