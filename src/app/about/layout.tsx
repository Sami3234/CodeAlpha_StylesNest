import type { Metadata } from 'next';
import AboutSeoContent from '@/components/seo/AboutSeoContent';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getContactForSchema } from '@/lib/seo/contact-for-schema';

export const metadata: Metadata = buildPageMetadata({
  title: 'About Us & Contact',
  description:
    'Learn about StylesNest — your trusted online store in Pakistan. Contact us via WhatsApp, phone or email. Free delivery and cash on delivery available.',
  path: '/about',
  keywords: ['StylesNest about', 'contact StylesNest', 'online store Pakistan'],
});

export default async function AboutLayout({ children }: { children: React.ReactNode }) {
  const contact = await getContactForSchema();

  return (
    <>
      <AboutSeoContent
        phone={contact.phone}
        email={contact.email}
        address={contact.address}
      />
      {children}
    </>
  );
}
