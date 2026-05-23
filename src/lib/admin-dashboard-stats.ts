import { queryAbandonedCount, queryAdminOrderStats } from '@/lib/admin-orders-query';
import { safeCount } from '@/lib/safe-number';
import { countApprovedReviews, countPendingReviews, countProductReviews } from '@/lib/product-reviews';
import { countOpenSupportTickets, countSupportTickets } from '@/lib/support-tickets';
import { countShopUsers } from '@/lib/shop-users';

export type AdminDashboardStats = {
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

export async function queryAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    totalUsers,
    totalReviews,
    pendingReviews,
    approvedReviews,
    openSupportTickets,
    totalSupportTickets,
    unsubmittedOrders,
  ] = await Promise.all([
    countShopUsers(),
    countProductReviews(),
    countPendingReviews(),
    countApprovedReviews(),
    countOpenSupportTickets(),
    countSupportTickets(),
    safeAbandonedCount(),
  ]);

  return {
    totalUsers: safeCount(totalUsers),
    totalReviews: safeCount(totalReviews),
    pendingReviews: safeCount(pendingReviews),
    approvedReviews: safeCount(approvedReviews),
    openSupportTickets: safeCount(openSupportTickets),
    totalSupportTickets: safeCount(totalSupportTickets),
    unsubmittedOrders: safeCount(unsubmittedOrders),
  };
}

/** Order stats + shop users / reviews / support counts for the admin dashboard. */
export async function queryAdminDashboardOverview() {
  const [orders, extras] = await Promise.all([
    queryAdminOrderStats(),
    queryAdminDashboardStats(),
  ]);
  return { orders, ...extras };
}
