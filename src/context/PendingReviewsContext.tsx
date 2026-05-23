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
import { useSession } from 'next-auth/react';
import type { ReviewStatus } from '@/lib/product-reviews-schema';

export type ReviewableItem = {
  orderId: string;
  productId: number;
  productName: string;
  productCode: string;
  deliveredAt: string;
  existingReviewId: number | null;
  existingStatus: ReviewStatus | null;
};

type PendingReviewsContextValue = {
  items: ReviewableItem[];
  pendingCount: number;
  loading: boolean;
  ready: boolean;
  refresh: (force?: boolean) => Promise<void>;
};

const PendingReviewsContext = createContext<PendingReviewsContextValue | undefined>(
  undefined,
);

const CACHE_MS = 45_000;

export function PendingReviewsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<ReviewableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const inflightRef = useRef(false);
  const lastFetchRef = useRef(0);

  const refresh = useCallback(async (force = false) => {
    if (status !== 'authenticated') {
      setItems([]);
      setReady(true);
      return;
    }

    const now = Date.now();
    if (!force && lastFetchRef.current > 0 && now - lastFetchRef.current < CACHE_MS) {
      return;
    }
    if (inflightRef.current) return;

    inflightRef.current = true;
    setLoading((prev) => prev || lastFetchRef.current === 0);

    try {
      const res = await fetch('/api/account/reviewable', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items as ReviewableItem[]);
      }
    } catch {
      /* keep previous */
    } finally {
      inflightRef.current = false;
      lastFetchRef.current = Date.now();
      setLoading(false);
      setReady(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      void refresh(true);
    } else {
      setItems([]);
      setReady(status !== 'loading');
      lastFetchRef.current = 0;
    }
  }, [status, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && status === 'authenticated') {
        void refresh(false);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [status, refresh]);

  const pendingCount = useMemo(
    () => items.filter((i) => !i.existingStatus).length,
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      pendingCount,
      loading,
      ready,
      refresh,
    }),
    [items, pendingCount, loading, ready, refresh],
  );

  return (
    <PendingReviewsContext.Provider value={value}>{children}</PendingReviewsContext.Provider>
  );
}

export function usePendingReviews() {
  const ctx = useContext(PendingReviewsContext);
  if (!ctx) {
    throw new Error('usePendingReviews must be used within PendingReviewsProvider');
  }
  return ctx;
}
