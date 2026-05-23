'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { NETWORK_FAILURE_EVENT } from '@/lib/client-fetch';

export type OfflineBannerMode = 'hidden' | 'offline' | 'back-online';

type NetworkStatusContextValue = {
  isOnline: boolean;
  offlineBannerMode: OfflineBannerMode;
  /** Recent failed fetch while browser still reports online */
  hadRecentFailure: boolean;
  clearRecentFailure: () => void;
  reportFailure: () => void;
};

const NetworkStatusContext = createContext<NetworkStatusContextValue | undefined>(undefined);

const BACK_ONLINE_BANNER_MS = 3500;

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineBannerMode, setOfflineBannerMode] = useState<OfflineBannerMode>('hidden');
  const [hadRecentFailure, setHadRecentFailure] = useState(false);
  const wasOfflineRef = useRef(false);
  const backOnlineTimerRef = useRef<number | null>(null);

  const clearBackOnlineTimer = useCallback(() => {
    if (backOnlineTimerRef.current !== null) {
      window.clearTimeout(backOnlineTimerRef.current);
      backOnlineTimerRef.current = null;
    }
  }, []);

  const applyOnlineState = useCallback(
    (online: boolean) => {
      setIsOnline(online);
      if (!online) {
        clearBackOnlineTimer();
        wasOfflineRef.current = true;
        setOfflineBannerMode('offline');
        return;
      }

      setHadRecentFailure(false);
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        setOfflineBannerMode('back-online');
        clearBackOnlineTimer();
        backOnlineTimerRef.current = window.setTimeout(() => {
          setOfflineBannerMode('hidden');
          backOnlineTimerRef.current = null;
        }, BACK_ONLINE_BANNER_MS);
      }
    },
    [clearBackOnlineTimer],
  );

  useEffect(() => {
    const sync = () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      applyOnlineState(online);
    };

    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    const onFailure = () => {
      setHadRecentFailure(true);
      if (!navigator.onLine) {
        applyOnlineState(false);
      }
    };
    window.addEventListener(NETWORK_FAILURE_EVENT, onFailure);

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
      window.removeEventListener(NETWORK_FAILURE_EVENT, onFailure);
      clearBackOnlineTimer();
    };
  }, [applyOnlineState, clearBackOnlineTimer]);

  const reportFailure = useCallback(() => setHadRecentFailure(true), []);
  const clearRecentFailure = useCallback(() => setHadRecentFailure(false), []);

  const value = useMemo(
    () => ({
      isOnline,
      offlineBannerMode,
      hadRecentFailure,
      clearRecentFailure,
      reportFailure,
    }),
    [isOnline, offlineBannerMode, hadRecentFailure, clearRecentFailure, reportFailure],
  );

  return (
    <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  const ctx = useContext(NetworkStatusContext);
  if (!ctx) {
    throw new Error('useNetworkStatus must be used within NetworkStatusProvider');
  }
  return ctx;
}
