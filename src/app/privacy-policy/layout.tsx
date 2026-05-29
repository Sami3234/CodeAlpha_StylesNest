import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description:
    'StylesNest Privacy Policy — how we collect, use, and protect your personal information when you shop online in Pakistan.',
  path: '/privacy-policy',
  keywords: ['privacy policy', 'StylesNest privacy', 'cookies', 'data protection'],
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
