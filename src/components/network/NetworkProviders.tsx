'use client';

import type { ReactNode } from 'react';
import { NetworkStatusProvider } from '@/context/NetworkStatusContext';
import OfflineBanner from '@/components/network/OfflineBanner';

/** Global online/offline banner + status context for the whole app. */
export default function NetworkProviders({ children }: { children: ReactNode }) {
  return (
    <NetworkStatusProvider>
      <OfflineBanner />
      {children}
    </NetworkStatusProvider>
  );
}
