import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { ProductProvider } from "@/context/ProductContext";
import { OrderProvider } from "@/context/OrderContext";
import { CartProvider } from "@/context/CartContext";
import AuthProvider from "@/components/providers/AuthProvider";
import { LoginModalProvider } from "@/context/LoginModalContext";
import JsonLd from "@/components/seo/JsonLd";
import { rootMetadata } from "@/lib/seo/metadata";
import { onlineStoreJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld-builders";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${brandMark.variable} font-sans antialiased bg-[#f5f5f5]`}
        style={{ backgroundColor: '#f5f5f5', color: '#171717' }}
        suppressHydrationWarning
      >
        <JsonLd data={[organizationJsonLd(), websiteJsonLd(), onlineStoreJsonLd()]} />
        <AuthProvider>
          <LoginModalProvider>
            <ProductProvider>
              <CartProvider>
                <OrderProvider>
                  {children}
                </OrderProvider>
              </CartProvider>
            </ProductProvider>
          </LoginModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
