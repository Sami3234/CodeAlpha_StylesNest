import {
  queryAbandonedCount,
  queryAdminOrdersList,
  queryAdminOrderStats,
  queryRecentOrders,
} from '@/lib/admin-orders-query';
import { queryAdminDashboardStats } from '@/lib/admin-dashboard-stats';
import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { mapProductRow } from '@/lib/product-mapper';
import { sql } from '@/lib/db';
import { safeCount } from '@/lib/safe-number';

export const ADMIN_BOOTSTRAP_EVENT = 'stylesnest:admin-bootstrap';

export type AdminBootstrapPayload = {
  serverTime: string;
  orders: Awaited<ReturnType<typeof queryAdminOrdersList>>['orders'];
  stats: Awaited<ReturnType<typeof queryAdminOrderStats>>;
  recentOrders: Awaited<ReturnType<typeof queryRecentOrders>>;
  abandonedCount: number;
  products: ReturnType<typeof mapProductRow>[];
  totalUsers: number;
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  openSupportTickets: number;
  totalSupportTickets: number;
  unsubmittedOrders: number;
};

async function queryAdminCatalogProducts() {
  await ensureProductSchema();
  const rows = await sql`
    SELECT
      id, title_en, title_ar, description_en, description_ar,
      current_price, original_price, discount, image, images,
      free_delivery, sold_count, category, features_en, features_ar,
      pricing_tiers, clothes_options, shoes_options, product_meta,
      status, created_at, updated_at
    FROM products
    ORDER BY created_at DESC
  `;
  return rows.map((row: Record<string, unknown>) => mapProductRow(row));
}

async function safeAbandonedCount(): Promise<number> {
  try {
    return safeCount(await queryAbandonedCount());
  } catch {
    return 0;
  }
}

/** One DB auth window: orders + stats + products + dashboard counts for admin panel load. */
export async function queryAdminBootstrap(): Promise<AdminBootstrapPayload> {
  const listResult = await queryAdminOrdersList({ limit: 500, page: 1 });
  const stats = await queryAdminOrderStats();
  const [recentOrders, abandonedCount, dashboard, products] = await Promise.all([
    queryRecentOrders(8),
    safeAbandonedCount(),
    queryAdminDashboardStats(),
    queryAdminCatalogProducts(),
  ]);

  return {
    serverTime: new Date().toISOString(),
    orders: listResult.orders,
    stats,
    recentOrders,
    abandonedCount,
    products,
    ...dashboard,
  };
}

export function dispatchAdminBootstrap(detail: AdminBootstrapPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_BOOTSTRAP_EVENT, { detail }));
}
