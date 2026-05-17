'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NETWORK_FAILURE_EVENT } from '@/lib/client-fetch';

type NetworkStatusContextValue = {
  isOnline: boolean;
  /** Recent failed fetch while browser still reports online */
  hadRecentFailure: boolean;
  clearRecentFailure: () => void;
  reportFailure: () => void;
};

const NetworkStatusContext = createContext<NetworkStatusContextValue | undefined>(undefined);

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [hadRecentFailure, setHadRecentFailure] = useState(false);

  useEffect(() => {
    const sync = () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnline(online);
      if (online) {
        setHadRecentFailure(false);
      }
    };

    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    const onFailure = () => {
      setHadRecentFailure(true);
      if (!navigator.onLine) setIsOnline(false);
    };
    window.addEventListener(NETWORK_FAILURE_EVENT, onFailure);

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
      window.removeEventListener(NETWORK_FAILURE_EVENT, onFailure);
    };
  }, []);

  const reportFailure = useCallback(() => setHadRecentFailure(true), []);
  const clearRecentFailure = useCallback(() => setHadRecentFailure(false), []);

  const value = useMemo(
    () => ({
      isOnline,
      hadRecentFailure,
      clearRecentFailure,
      reportFailure,
    }),
    [isOnline, hadRecentFailure, clearRecentFailure, reportFailure],
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
