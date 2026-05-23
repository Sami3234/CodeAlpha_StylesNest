'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { friendlyErrorMessage } from '@/lib/notify';
import { clientMessageFromApi } from '@/lib/safe-errors';
import type { Order } from '@/types/order';
import type { AdminOrderStats } from '@/lib/admin-orders-query';
import type { FetchErrorKind } from '@/lib/is-network-error';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import { isProtectedAdminPanelPath, adminPath } from '@/lib/admin-path';
import { fetchAdminAuthenticated } from '@/lib/admin-auth-client';
import { ADMIN_LIVE_POLL_MS } from '@/lib/admin-live-sync';
import type { AdminReviewAlert } from '@/lib/product-reviews';
import type { AdminSupportAlert } from '@/lib/support-tickets';
import type { AdminUserAlert } from '@/lib/shop-users';
import {
  getCurrentTimeInTimezone,
  getTodayDateInTimezone,
  isOrderToday,
} from '@/lib/order-date';

export type { Order, OrderProduct } from '@/types/order';

export type OrderNotificationCounts = {
  pending: number;
  today: number;
  unseenNew: number;
  abandoned: number;
};

interface OrderContextType {
  orders: Order[];
  addOrder: (
    order: Omit<Order, 'id' | 'date' | 'time'>,
  ) => Promise<{ order: Order | null; error?: string }>;
  updateOrder: (id: string, orderData: Partial<Omit<Order, 'id'>>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  deleteOrder: (id: string) => void;
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrderStats: () => AdminOrderStats & { todayOrders: number };
  orderNotifications: OrderNotificationCounts;
  /** New orders since you last opened the bell (not “recent” history). */
  newOrderAlerts: Order[];
  /** New pending reviews since you last opened the bell. */
  newReviewAlerts: AdminReviewAlert[];
  newSupportAlerts: AdminSupportAlert[];
  newUserAlerts: AdminUserAlert[];
  lastRefreshedAt: string | null;
  clearOrderNotifications: () => void;
  clearReviewNotifications: () => void;
  clearSupportNotifications: () => void;
  clearUserNotifications: () => void;
  loading: boolean;
  fetchError: FetchErrorKind | null;
  reloadOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const getTodayDate = () => getTodayDateInTimezone();
const getCurrentTime = () => getCurrentTimeInTimezone().slice(0, 5);

const defaultStats = (): AdminOrderStats & { todayOrders: number } => ({
  total: 0,
  pending: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  pendingAmount: 0,
  processingAmount: 0,
  completedAmount: 0,
  cancelledAmount: 0,
  totalRevenue: 0,
  todayOrders: 0,
});

function mergeOrders(prev: Order[], incoming: Order[]): Order[] {
  if (incoming.length === 0) return prev;
  const map = new Map(prev.map((o) => [o.id, o]));
  for (const o of incoming) map.set(o.id, o);
  return Array.from(map.values()).sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return b.time.localeCompare(a.time);
  });
}

/** Orders not yet seen this session (deduped across live + recent lists). */
function pickFreshOrders(knownIds: Set<string>, ...lists: Order[][]): Order[] {
  const fresh: Order[] = [];
  const batchSeen = new Set<string>();
  for (const list of lists) {
    for (const o of list) {
      if (knownIds.has(o.id) || batchSeen.has(o.id)) continue;
      batchSeen.add(o.id);
      fresh.push(o);
    }
  }
  return fresh;
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const protectedAdmin = isProtectedAdminPanelPath(pathname);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serverStats, setServerStats] = useState<AdminOrderStats | null>(null);
  const [newOrderAlerts, setNewOrderAlerts] = useState<Order[]>([]);
  const [newReviewAlerts, setNewReviewAlerts] = useState<AdminReviewAlert[]>([]);
  const [newSupportAlerts, setNewSupportAlerts] = useState<AdminSupportAlert[]>([]);
  const [newUserAlerts, setNewUserAlerts] = useState<AdminUserAlert[]>([]);
  const [abandonedCount, setAbandonedCount] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(protectedAdmin);
  const [fetchError, setFetchError] = useState<FetchErrorKind | null>(null);
  const [unseenNew, setUnseenNew] = useState(0);

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const knownReviewIdsRef = useRef<Set<number>>(new Set());
  const knownSupportIdsRef = useRef<Set<number>>(new Set());
  const knownUserIdsRef = useRef<Set<number>>(new Set());
  const pollInitializedRef = useRef(false);
  const reviewPollInitializedRef = useRef(false);
  const supportPollInitializedRef = useRef(false);
  const userPollInitializedRef = useRef(false);
  const lastSyncRef = useRef<string | null>(null);
  const lastReviewSyncRef = useRef<string | null>(null);
  const lastSupportSyncRef = useRef<string | null>(null);
  const lastUserSyncRef = useRef<string | null>(null);

  const appendNewOrderAlerts = useCallback((fresh: Order[]) => {
    if (fresh.length === 0) return;
    setNewOrderAlerts((prev) => {
      const seen = new Set(prev.map((o) => o.id));
      const unique = fresh.filter((o) => !seen.has(o.id));
      if (unique.length === 0) return prev;
      const next = [...unique, ...prev].slice(0, 20);
      setUnseenNew(next.length);
      return next;
    });
  }, []);

  const appendNewReviewAlerts = useCallback((fresh: AdminReviewAlert[]) => {
    if (fresh.length === 0) return;
    setNewReviewAlerts((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      const unique = fresh.filter((r) => !seen.has(r.id));
      if (unique.length === 0) return prev;
      return [...unique, ...prev].slice(0, 20);
    });
  }, []);

  const appendNewSupportAlerts = useCallback((fresh: AdminSupportAlert[]) => {
    if (fresh.length === 0) return;
    setNewSupportAlerts((prev) => {
      const seen = new Set(prev.map((t) => t.id));
      const unique = fresh.filter((t) => !seen.has(t.id));
      if (unique.length === 0) return prev;
      return [...unique, ...prev].slice(0, 20);
    });
  }, []);

  const appendNewUserAlerts = useCallback((fresh: AdminUserAlert[]) => {
    if (fresh.length === 0) return;
    setNewUserAlerts((prev) => {
      const seen = new Set(prev.map((u) => u.id));
      const unique = fresh.filter((u) => !seen.has(u.id));
      if (unique.length === 0) return prev;
      return [...unique, ...prev].slice(0, 20);
    });
  }, []);

  const notifyNewReviews = useCallback(
    (fresh: AdminReviewAlert[]) => {
      if (fresh.length === 0) return;
      appendNewReviewAlerts(fresh);
      if (document.visibilityState !== 'visible') return;
      if (fresh.length === 1) {
        const r = fresh[0];
        toast.success('New review submitted', {
          description: `${r.reviewerName} · ${r.productName ?? `Product #${r.productId}`} · ${r.rating}★`,
          action: {
            label: 'Moderate',
            onClick: () => {
              window.location.href = adminPath('/reviews');
            },
          },
        });
      } else {
        toast.success(`${fresh.length} new reviews to moderate`, {
          description: 'Open the notification bell to see details.',
          action: {
            label: 'Reviews',
            onClick: () => {
              window.location.href = adminPath('/reviews');
            },
          },
        });
      }
    },
    [appendNewReviewAlerts],
  );

  const notifyNewSupport = useCallback(
    (fresh: AdminSupportAlert[]) => {
      if (fresh.length === 0) return;
      appendNewSupportAlerts(fresh);
      if (document.visibilityState !== 'visible') return;
      if (fresh.length === 1) {
        const t = fresh[0];
        toast.success('New support request', {
          description: `${t.name} · ${t.subject}`,
          action: {
            label: 'Support',
            onClick: () => {
              window.location.href = adminPath('/support');
            },
          },
        });
      } else {
        toast.success(`${fresh.length} new support requests`, {
          description: 'Open the notification bell to see details.',
          action: {
            label: 'Support',
            onClick: () => {
              window.location.href = adminPath('/support');
            },
          },
        });
      }
    },
    [appendNewSupportAlerts],
  );

  const notifyNewUsers = useCallback(
    (fresh: AdminUserAlert[]) => {
      if (fresh.length === 0) return;
      appendNewUserAlerts(fresh);
      if (document.visibilityState !== 'visible') return;
      if (fresh.length === 1) {
        const u = fresh[0];
        toast.success('New user registered', {
          description: u.email ?? u.name ?? `User #${u.id}`,
          action: {
            label: 'Users',
            onClick: () => {
              window.location.href = adminPath('/users');
            },
          },
        });
      } else {
        toast.success(`${fresh.length} new users registered`, {
          description: 'Open the notification bell to see details.',
          action: {
            label: 'Users',
            onClick: () => {
              window.location.href = adminPath('/users');
            },
          },
        });
      }
    },
    [appendNewUserAlerts],
  );

  const notifyNewOrders = useCallback((fresh: Order[]) => {
    if (fresh.length === 0) return;
    appendNewOrderAlerts(fresh);
    if (document.visibilityState !== 'visible') return;
        if (fresh.length === 1) {
          const o = fresh[0];
          const ids = o.products
            .map((p) => p.productId)
            .filter((id): id is number => typeof id === 'number' && id > 0)
            .join(', ');
          toast.success('New order received', {
            description: ids
              ? `${o.customer} · Product ID: ${ids}`
              : `${o.customer} · ${o.id}`,
            action: {
              label: 'View orders',
              onClick: () => {
                window.location.href = adminPath('/orders');
              },
            },
          });
        } else {
          toast.success(`${fresh.length} new orders received`, {
            description: 'Open the notification bell to see customer names and product IDs.',
            action: {
              label: 'View orders',
              onClick: () => {
                window.location.href = adminPath('/orders');
              },
            },
          });
        }
  }, [appendNewOrderAlerts]);

  const applyLivePayload = useCallback(
    (payload: {
      serverTime: string;
      stats: AdminOrderStats;
      changedOrders: Order[];
      recentOrders?: Order[];
      abandonedCount: number;
    }, options?: { notify?: boolean }) => {
      setServerStats(payload.stats);
      setAbandonedCount(payload.abandonedCount);
      setLastRefreshedAt(payload.serverTime);
      lastSyncRef.current = payload.serverTime;

      const shouldNotify = Boolean(options?.notify && protectedAdmin);
      const recentOrders = payload.recentOrders ?? [];
      const incoming = [...payload.changedOrders, ...recentOrders];

      if (!pollInitializedRef.current) {
        if (incoming.length > 0) {
          incoming.forEach((o) => knownOrderIdsRef.current.add(o.id));
          setOrders((prev) => mergeOrders(prev, payload.changedOrders));
        }
        pollInitializedRef.current = true;
        return;
      }

      if (incoming.length > 0) {
        const fresh = pickFreshOrders(
          knownOrderIdsRef.current,
          payload.changedOrders,
          recentOrders,
        );
        incoming.forEach((o) => knownOrderIdsRef.current.add(o.id));
        if (fresh.length > 0 && shouldNotify) notifyNewOrders(fresh);
        if (payload.changedOrders.length > 0) {
          setOrders((prev) => mergeOrders(prev, payload.changedOrders));
        }
      }
    },
    [protectedAdmin, notifyNewOrders],
  );

  const fetchFullOrders = useCallback(async (): Promise<boolean> => {
    if (!isProtectedAdminPanelPath(pathname)) return false;
    if (!(await fetchAdminAuthenticated())) return false;
    const response = await clientFetch('/api/orders', { cache: 'no-store' });
    if (response.status === 401) return false;
    if (!response.ok) {
      const fallback = await clientFetch('/api/admin/orders/list?limit=500&page=1', {
        cache: 'no-store',
      });
      if (!fallback.ok) {
        console.error('Failed to fetch orders', response.status, fallback.status);
        return false;
      }
      const data = await fallback.json();
      const incoming: Order[] = data.orders ?? [];
      incoming.forEach((o) => knownOrderIdsRef.current.add(o.id));
      setOrders(incoming);
      pollInitializedRef.current = true;
      return true;
    }
    const data = await response.json();
    const incoming: Order[] = data.orders ?? [];
    incoming.forEach((o) => knownOrderIdsRef.current.add(o.id));
    setOrders(incoming);
    pollInitializedRef.current = true;
    return true;
  }, [pathname]);

  const fetchReviewLive = useCallback(
    async (options?: { silent?: boolean; notify?: boolean }) => {
      if (!isProtectedAdminPanelPath(pathname)) return;
      if (!(await fetchAdminAuthenticated())) return;
      const silent = options?.silent ?? false;
      const notify = options?.notify ?? false;

      try {
        const since = lastReviewSyncRef.current;
        const url = since
          ? `/api/admin/reviews/live?since=${encodeURIComponent(since)}`
          : '/api/admin/reviews/live';

        const response = await clientFetch(url, { cache: 'no-store' });
        if (!response.ok) {
          if (!silent) console.error('Review live sync failed');
          return;
        }

        const data = await response.json();
        const incoming: AdminReviewAlert[] = data.newReviews ?? [];
        lastReviewSyncRef.current = data.serverTime ?? new Date().toISOString();

        if (!reviewPollInitializedRef.current) {
          incoming.forEach((r) => knownReviewIdsRef.current.add(r.id));
          reviewPollInitializedRef.current = true;
          return;
        }

        const fresh = incoming.filter((r) => !knownReviewIdsRef.current.has(r.id));
        incoming.forEach((r) => knownReviewIdsRef.current.add(r.id));
        if (fresh.length > 0 && notify && protectedAdmin) notifyNewReviews(fresh);
      } catch (error) {
        if (!silent) console.error('Review live sync error:', error);
      }
    },
    [pathname, protectedAdmin, notifyNewReviews],
  );

  const fetchSupportLive = useCallback(
    async (options?: { silent?: boolean; notify?: boolean }) => {
      if (!isProtectedAdminPanelPath(pathname)) return;
      if (!(await fetchAdminAuthenticated())) return;
      const silent = options?.silent ?? false;
      const notify = options?.notify ?? false;

      try {
        const since = lastSupportSyncRef.current;
        const url = since
          ? `/api/admin/support/live?since=${encodeURIComponent(since)}`
          : '/api/admin/support/live';

        const response = await clientFetch(url, { cache: 'no-store' });
        if (!response.ok) {
          if (!silent) console.error('Support live sync failed');
          return;
        }

        const data = await response.json();
        const incoming: AdminSupportAlert[] = data.newTickets ?? [];
        lastSupportSyncRef.current = data.serverTime ?? new Date().toISOString();

        if (!supportPollInitializedRef.current) {
          incoming.forEach((t) => knownSupportIdsRef.current.add(t.id));
          supportPollInitializedRef.current = true;
          return;
        }

        const fresh = incoming.filter((t) => !knownSupportIdsRef.current.has(t.id));
        incoming.forEach((t) => knownSupportIdsRef.current.add(t.id));
        if (fresh.length > 0 && notify && protectedAdmin) notifyNewSupport(fresh);
      } catch (error) {
        if (!silent) console.error('Support live sync error:', error);
      }
    },
    [pathname, protectedAdmin, notifyNewSupport],
  );

  const fetchUserLive = useCallback(
    async (options?: { silent?: boolean; notify?: boolean }) => {
      if (!isProtectedAdminPanelPath(pathname)) return;
      if (!(await fetchAdminAuthenticated())) return;
      const silent = options?.silent ?? false;
      const notify = options?.notify ?? false;

      try {
        const since = lastUserSyncRef.current;
        const url = since
          ? `/api/admin/users/live?since=${encodeURIComponent(since)}`
          : '/api/admin/users/live';

        const response = await clientFetch(url, { cache: 'no-store' });
        if (!response.ok) {
          if (!silent) console.error('Users live sync failed');
          return;
        }

        const data = await response.json();
        const incoming: AdminUserAlert[] = data.newUsers ?? [];
        lastUserSyncRef.current = data.serverTime ?? new Date().toISOString();

        if (!userPollInitializedRef.current) {
          incoming.forEach((u) => knownUserIdsRef.current.add(u.id));
          userPollInitializedRef.current = true;
          return;
        }

        const fresh = incoming.filter((u) => !knownUserIdsRef.current.has(u.id));
        incoming.forEach((u) => knownUserIdsRef.current.add(u.id));
        if (fresh.length > 0 && notify && protectedAdmin) notifyNewUsers(fresh);
      } catch (error) {
        if (!silent) console.error('Users live sync error:', error);
      }
    },
    [pathname, protectedAdmin, notifyNewUsers],
  );

  const fetchLive = useCallback(
    async (options?: { silent?: boolean; notify?: boolean }) => {
      if (!isProtectedAdminPanelPath(pathname)) return;
      if (!(await fetchAdminAuthenticated())) return;
      const silent = options?.silent ?? false;
      const notify = options?.notify ?? false;

      try {
        if (!silent) setFetchError(null);
        const since = lastSyncRef.current;
        const url = since
          ? `/api/admin/orders/live?since=${encodeURIComponent(since)}`
          : '/api/admin/orders/live';

        const response = await clientFetch(url, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          applyLivePayload(
            {
              serverTime: data.serverTime,
              stats: data.stats,
              changedOrders: data.changedOrders ?? [],
              recentOrders: data.recentOrders ?? [],
              abandonedCount: data.abandonedCount ?? 0,
            },
            { notify },
          );
          setFetchError(null);
        } else if (!silent) {
          console.error('Live sync failed');
        }
      } catch (error) {
        if (!silent) {
          if (error instanceof NetworkError) setFetchError(error.kind);
          console.error('Live sync error:', error);
        }
      }
    },
    [pathname, applyLivePayload],
  );

  const reloadOrders = useCallback(async () => {
    try {
      await fetchFullOrders();
      await fetchLive({ silent: true, notify: false });
    } catch (error) {
      console.error('reloadOrders:', error);
    }
  }, [fetchFullOrders, fetchLive]);

  useEffect(() => {
    if (!protectedAdmin) {
      setLoading(false);
      pollInitializedRef.current = false;
      knownOrderIdsRef.current.clear();
      lastSyncRef.current = null;
      setUnseenNew(0);
      setNewOrderAlerts([]);
      setNewReviewAlerts([]);
      setNewSupportAlerts([]);
      setNewUserAlerts([]);
      knownReviewIdsRef.current.clear();
      knownSupportIdsRef.current.clear();
      knownUserIdsRef.current.clear();
      reviewPollInitializedRef.current = false;
      supportPollInitializedRef.current = false;
      userPollInitializedRef.current = false;
      lastReviewSyncRef.current = null;
      lastSupportSyncRef.current = null;
      lastUserSyncRef.current = null;
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setFetchError(null);
        await fetchFullOrders();
        if (!cancelled) {
          await fetchLive({ silent: true, notify: false });
          await fetchReviewLive({ silent: true, notify: false });
          await fetchSupportLive({ silent: true, notify: false });
          await fetchUserLive({ silent: true, notify: false });
        }
      } catch (error) {
        if (error instanceof NetworkError) setFetchError(error.kind);
        console.error('Initial admin orders load:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchLive({ silent: true, notify: true });
        void fetchReviewLive({ silent: true, notify: true });
        void fetchSupportLive({ silent: true, notify: true });
        void fetchUserLive({ silent: true, notify: true });
      }
    }, ADMIN_LIVE_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchLive({ silent: true, notify: true });
        void fetchReviewLive({ silent: true, notify: true });
        void fetchSupportLive({ silent: true, notify: true });
        void fetchUserLive({ silent: true, notify: true });
      }
    };
    const onFocus = () => {
      void fetchLive({ silent: true, notify: true });
      void fetchReviewLive({ silent: true, notify: true });
      void fetchSupportLive({ silent: true, notify: true });
      void fetchUserLive({ silent: true, notify: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [
    protectedAdmin,
    fetchFullOrders,
    fetchLive,
    fetchReviewLive,
    fetchSupportLive,
    fetchUserLive,
  ]);

  const clearOrderNotifications = useCallback(() => {
    setUnseenNew(0);
    setNewOrderAlerts([]);
  }, []);

  const clearReviewNotifications = useCallback(() => {
    setNewReviewAlerts([]);
  }, []);

  const clearSupportNotifications = useCallback(() => {
    setNewSupportAlerts([]);
  }, []);

  const clearUserNotifications = useCallback(() => {
    setNewUserAlerts([]);
  }, []);

  const addOrder = async (
    orderData: Omit<Order, 'id' | 'date' | 'time'>,
  ): Promise<{ order: Order | null; error?: string }> => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const existingOrderIndex = orders.findIndex((order) => {
      if (order.phone !== orderData.phone) return false;
      try {
        const [year, month, day] = order.date.split('-').map(Number);
        const [hours, minutes] = order.time.split(':').map(Number);
        const orderDateTime = new Date(year, month - 1, day, hours, minutes);
        return orderDateTime >= oneHourAgo && orderDateTime <= now;
      } catch {
        return false;
      }
    });

    if (existingOrderIndex >= 0) {
      const existingOrder = orders[existingOrderIndex];
      const updatedOrder = {
        ...existingOrder,
        products: [...existingOrder.products, ...orderData.products],
        total: existingOrder.total + orderData.total,
        customer: orderData.customer,
        city: orderData.city,
        address: orderData.address,
        time: getCurrentTime(),
      };

      try {
        const response = await clientFetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrder),
        });

        if (response.ok) {
          const data = await response.json();
          const filteredOrders = orders.filter((_, index) => index !== existingOrderIndex);
          knownOrderIdsRef.current.add(data.order.id);
          setOrders([data.order, ...filteredOrders]);
          void fetchLive({ silent: true });
          return { order: data.order as Order };
        }
        const errBody = await response.json().catch(() => ({}));
        const message = friendlyErrorMessage(
          clientMessageFromApi(errBody, 'Failed to update order'),
          'Failed to update order',
        );
        return { order: null, error: message };
      } catch {
        return {
          order: null,
          error: friendlyErrorMessage('Network error while placing order'),
        };
      }
    }

    const newOrder: Order = {
      ...orderData,
      id: '',
      date: getTodayDate(),
      time: getCurrentTime(),
    };

    try {
      const response = await clientFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      if (response.ok) {
        const data = await response.json();
        knownOrderIdsRef.current.add(data.order.id);
        setOrders([data.order, ...orders]);
        void fetchLive({ silent: true });
        return { order: data.order as Order };
      }
      const errBody = await response.json().catch(() => ({}));
      const message = friendlyErrorMessage(
        clientMessageFromApi(errBody, 'Failed to place order'),
        'Failed to place order',
      );
      return { order: null, error: message };
    } catch {
      return {
        order: null,
        error: friendlyErrorMessage('Network error while placing order'),
      };
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Omit<Order, 'id'>>) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const updatedOrder = { ...order, ...orderData };

    try {
      const response = await clientFetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
        void fetchLive({ silent: true });
      } else {
        const errBody = await response.json().catch(() => ({}));
        const message =
          typeof errBody.error === 'string' ? errBody.error : 'Failed to update order';
        toast.error(message);
      }
    } catch {
      toast.error('Failed to update order');
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    await updateOrder(id, { status });
  };

  const deleteOrder = async (id: string) => {
    try {
      const response = await clientFetch(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        knownOrderIdsRef.current.delete(id);
        setOrders((prev) => prev.filter((order) => order.id !== id));
        void fetchLive({ silent: true });
      } else {
        toast.error('Failed to delete order');
      }
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const getOrdersByStatus = (status: Order['status']) =>
    orders.filter((order) => order.status === status);

  const getOrderStats = () => {
    if (serverStats) {
      return { ...serverStats, todayOrders: serverStats.todayOrders };
    }
    const today = getTodayDateInTimezone();
    const base = defaultStats();
    return {
      ...base,
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      pendingAmount: orders.filter((o) => o.status === 'pending').reduce((s, o) => s + o.total, 0),
      processingAmount: orders
        .filter((o) => o.status === 'processing' || o.status === 'shipped')
        .reduce((s, o) => s + o.total, 0),
      completedAmount: orders
        .filter((o) => o.status === 'delivered')
        .reduce((s, o) => s + o.total, 0),
      cancelledAmount: orders
        .filter((o) => o.status === 'cancelled')
        .reduce((s, o) => s + o.total, 0),
      totalRevenue: orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((s, o) => s + o.total, 0),
      todayOrders: orders.filter((o) => isOrderToday(o.date, today)).length,
    };
  };

  const stats = serverStats ?? defaultStats();
  const orderNotifications: OrderNotificationCounts = {
    pending: stats.pending,
    today: stats.todayOrders,
    unseenNew,
    abandoned: abandonedCount,
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        getOrdersByStatus,
        getOrderStats,
        orderNotifications,
        newOrderAlerts,
        newReviewAlerts,
        newSupportAlerts,
        newUserAlerts,
        lastRefreshedAt,
        clearOrderNotifications,
        clearReviewNotifications,
        clearSupportNotifications,
        clearUserNotifications,
        loading,
        fetchError,
        reloadOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
