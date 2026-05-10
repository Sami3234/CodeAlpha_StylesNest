import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { ProductProvider } from "@/context/ProductContext";
import { OrderProvider } from "@/context/OrderContext";
import { CartProvider } from "@/context/CartContext";

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

export const metadata: Metadata = {
  title: "StylesNest - Best Deals with Free Delivery",
  description: "Best deals on electronics, cosmetics, watches and more with free delivery across Pakistan. Cash on delivery available.",
  keywords: "StylesNest, Pakistan, online shopping, electronics, cosmetics, watches, free delivery",
};

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
      <body className={`${poppins.variable} ${brandMark.variable} font-sans antialiased bg-[#f5f5f5]`} suppressHydrationWarning>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              {children}
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </body>
    </html>
  );
}
