'use client';

import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { BACK_ONLINE_MESSAGE, OFFLINE_MESSAGE } from '@/lib/network-messages';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowBackOnline(false);
      return;
    }
    if (wasOffline) {
      setShowBackOnline(true);
      const t = window.setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3500);
      return () => window.clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showBackOnline) return null;

  const backOnline = isOnline && showBackOnline;

  return (
    <div
      className={`network-offline-banner${backOnline ? ' network-offline-banner--back' : ''}`}
      role="status"
      aria-live="polite"
    >
      <svg className="network-offline-banner__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
        {backOnline ? (
          <path
            d="M12 3a9 9 0 00-7.07 14.54l1.42-1.42A7 7 0 0112 5c1.85 0 3.55.7 4.83 1.86l1.41-1.41A9 9 0 0012 3zm0 4a5 5 0 00-3.87 8.16l1.42-1.42A3 3 0 0112 9c.79 0 1.52.3 2.07.79l1.41-1.41A5 5 0 0012 7zm-1 6v6h2v-6h-2z"
            fill="currentColor"
          />
        ) : (
          <>
            <path
              d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12c0 .74-.08 1.46-.23 2.15M5 12a10.94 10.94 0 015.17-4.82M12 20h.01M8.53 16.11a6 6 0 016.95 0M2 8.82a15.68 15.68 0 014.17-2.12M22 8.82a15.65 15.65 0 00-5.17-2.12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      <span>{backOnline ? BACK_ONLINE_MESSAGE : OFFLINE_MESSAGE}</span>
    </div>
  );
}
