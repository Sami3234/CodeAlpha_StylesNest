'use client';

import type { Session } from 'next-auth';
import type { ReactNode } from 'react';
import AppToaster from '@/components/ui/AppToaster';
import { ProductProvider } from '@/context/ProductContext';
import { OrderProvider } from '@/context/OrderProvider';
import { CartProvider } from '@/context/CartContext';
import AuthProvider from '@/components/providers/AuthProvider';
import { LoginModalProvider } from '@/context/LoginModalContext';
import NetworkProviders from '@/components/network/NetworkProviders';
import { ContactSettingsProvider } from '@/context/ContactSettingsContext';
import { PendingReviewsProvider } from '@/context/PendingReviewsContext';
import CookieConsent from '@/components/legal/CookieConsent';

/** All client-side app providers in one boundary (avoids SSR chunk issues in root layout). */
export default function AppProviders({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <NetworkProviders>
      <ContactSettingsProvider>
        <AuthProvider session={session}>
          <LoginModalProvider>
            <PendingReviewsProvider>
              <ProductProvider>
                <CartProvider>
                  <OrderProvider>
                    {children}
                    <CookieConsent />
                    <AppToaster variant="store" />
                  </OrderProvider>
                </CartProvider>
              </ProductProvider>
            </PendingReviewsProvider>
          </LoginModalProvider>
        </AuthProvider>
      </ContactSettingsProvider>
    </NetworkProviders>
  );
}
