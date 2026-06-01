import {
  queryAbandonedCount,
  queryAdminOrdersList,
  queryAdminOrderStats,
  queryRecentOrders,
} from '@/lib/admin-orders-query';
import { queryAdminDashboardStats } from '@/lib/admin-dashboard-stats';
import { mapProductRow } from '@/lib/product-mapper';
import { safeCount } from '@/lib/safe-number';

export const ADMIN_BOOTSTRAP_EVENT = 'stylesnest:admin-bootstrap';

export type AdminBootstrapPayload = {
  serverTime: string;
  orders: Awaited<ReturnType<typeof queryAdminOrdersList>>['orders'];
  stats: Awaited<ReturnType<typeof queryAdminOrderStats>>;
  recentOrders: Awaited<ReturnType<typeof queryRecentOrders>>;
  abandonedCount: number;
  /** Empty — catalog loads via GET /api/products (faster bootstrap on slow networks). */
  products: ReturnType<typeof mapProductRow>[];
  totalUsers: number;
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  openSupportTickets: number;
  totalSupportTickets: number;
  unsubmittedOrders: number;
};

async function safeAbandonedCount(): Promise<number> {
  try {
    return safeCount(await queryAbandonedCount());
  } catch {
    return 0;
  }
}

/** Orders + stats + dashboard counts. Products fetched separately to avoid Vercel timeouts. */
export async function queryAdminBootstrap(): Promise<AdminBootstrapPayload> {
  const listResult = await queryAdminOrdersList({ limit: 200, page: 1 });
  const stats = await queryAdminOrderStats();
  const [recentOrders, abandonedCount, dashboard] = await Promise.all([
    queryRecentOrders(8),
    safeAbandonedCount(),
    queryAdminDashboardStats(),
  ]);

  return {
    serverTime: new Date().toISOString(),
    orders: listResult.orders,
    stats,
    recentOrders,
    abandonedCount,
    products: [],
    ...dashboard,
  };
}

export function dispatchAdminBootstrap(detail: AdminBootstrapPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_BOOTSTRAP_EVENT, { detail }));
}
