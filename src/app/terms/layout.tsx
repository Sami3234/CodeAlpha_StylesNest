import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms & Conditions',
  description:
    'StylesNest Terms and Conditions for online shopping in Pakistan — orders, payments, and use of our website.',
  path: '/terms',
  keywords: ['terms and conditions', 'StylesNest terms', 'online store terms Pakistan'],
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
