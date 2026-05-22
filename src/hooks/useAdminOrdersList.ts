'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Order } from '@/types/order';
import type { AdminOrderStats } from '@/lib/admin-orders-query';
import { clientFetch } from '@/lib/client-fetch';

export type AdminOrdersListState = {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: AdminOrderStats | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useAdminOrdersList(): AdminOrdersListState {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<AdminOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = searchParams.get('status');
  const period = searchParams.get('period');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const q = searchParams.get('q');
  const pageParam = Number(searchParams.get('page') || '1');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageParam > 0 ? pageParam : 1));
      params.set('limit', '50');
      if (status && status !== 'all') params.set('status', status);
      if (period) params.set('period', period);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (q) params.set('q', q);

      const [listRes, statsRes] = await Promise.all([
        clientFetch(`/api/admin/orders/list?${params.toString()}`, { cache: 'no-store' }),
        clientFetch('/api/admin/orders/stats', { cache: 'no-store' }),
      ]);

      if (!listRes.ok) {
        const body = await listRes.json().catch(() => ({}));
        throw new Error(typeof body.error === 'string' ? body.error : 'Failed to load orders');
      }

      const listData = await listRes.json();
      setOrders(listData.orders ?? []);
      setTotal(listData.total ?? 0);
      setPage(listData.page ?? 1);
      setLimit(listData.limit ?? 50);
      setTotalPages(listData.totalPages ?? 1);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [status, period, from, to, q, pageParam]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages,
    stats,
    loading,
    error,
    reload: load,
  };
}
