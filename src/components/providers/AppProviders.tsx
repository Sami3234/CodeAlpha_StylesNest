'use client';

import type { ReactNode } from 'react';
import { ProductProvider } from '@/context/ProductContext';
import { OrderProvider } from '@/context/OrderProvider';
import { CartProvider } from '@/context/CartContext';
import AuthProvider from '@/components/providers/AuthProvider';
import { LoginModalProvider } from '@/context/LoginModalContext';
import NetworkProviders from '@/components/network/NetworkProviders';
import { ContactSettingsProvider } from '@/context/ContactSettingsContext';

/** All client-side app providers in one boundary (avoids SSR chunk issues in root layout). */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NetworkProviders>
      <ContactSettingsProvider>
      <AuthProvider>
        <LoginModalProvider>
          <ProductProvider>
            <CartProvider>
              <OrderProvider>{children}</OrderProvider>
            </CartProvider>
          </ProductProvider>
        </LoginModalProvider>
      </AuthProvider>
      </ContactSettingsProvider>
    </NetworkProviders>
  );
}
