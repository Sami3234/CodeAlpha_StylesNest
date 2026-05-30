import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import "@/components/product-card-badges.css";
import "@/components/product-code-chip.css";
import JsonLd from "@/components/seo/JsonLd";
import { rootMetadata } from "@/lib/seo/metadata";
import { onlineStoreJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld-builders";
import { getContactForSchema } from "@/lib/seo/contact-for-schema";
import AppProviders from "@/components/providers/AppProviders";
import MetaPixelScript from "@/components/analytics/MetaPixelScript";
import MetaPixelPageView from "@/components/analytics/MetaPixelPageView";
import { auth } from "@/auth";

export { rootMetadata as metadata };

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false,
});

/** Navbar wordmark — editorial / luxury serif */
const brandMark = Playfair_Display({
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  subsets: ["latin"],
  variable: "--font-brand-mark",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contact, session] = await Promise.all([getContactForSchema(), auth()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <MetaPixelScript />
      </head>
      <body
        className={`${poppins.variable} ${brandMark.variable} font-sans antialiased bg-[#f5f5f5]`}
        style={{ backgroundColor: '#f5f5f5', color: '#171717' }}
        suppressHydrationWarning
      >
        <JsonLd
          data={[organizationJsonLd(contact), websiteJsonLd(contact), onlineStoreJsonLd()]}
        />
        <AppProviders session={session}>{children}</AppProviders>
        <MetaPixelPageView />
      </body>
    </html>
  );
}
