import { adminPath } from '@/lib/admin-path';
import { formatOrderProductIds } from '@/lib/order-product-ids';
import type { Order } from '@/types/order';
import type { AdminReviewAlert } from '@/lib/product-reviews';
import type { AdminSupportAlert } from '@/lib/support-tickets';
import type { AdminUserAlert } from '@/lib/shop-users';

export type AdminNotificationKind = 'order' | 'review' | 'support' | 'user';

export type AdminNotificationItem = {
  id: string;
  kind: AdminNotificationKind;
  title: string;
  message: string;
  href: string;
  at: number;
};

function orderTimestamp(order: Order): number {
  const raw = `${order.date}T${order.time || '00:00'}`;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : Date.now();
}

function parseAt(value: string): number {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : Date.now();
}

export function buildAdminNotifications(input: {
  orders: Order[];
  reviews: AdminReviewAlert[];
  support: AdminSupportAlert[];
  users: AdminUserAlert[];
}): AdminNotificationItem[] {
  const items: AdminNotificationItem[] = [];

  for (const order of input.orders) {
    items.push({
      id: `order-${order.id}`,
      kind: 'order',
      title: 'New order',
      message: `${order.customer} · Product ID: ${formatOrderProductIds(order)}`,
      href: adminPath('/orders'),
      at: orderTimestamp(order),
    });
  }

  for (const review of input.reviews) {
    items.push({
      id: `review-${review.id}`,
      kind: 'review',
      title: 'New review',
      message: `${review.reviewerName} · ${review.rating}★ · ${review.productName ?? `Product #${review.productId}`}`,
      href: adminPath('/reviews'),
      at: parseAt(review.createdAt),
    });
  }

  for (const ticket of input.support) {
    items.push({
      id: `support-${ticket.id}`,
      kind: 'support',
      title: 'Support request',
      message: `${ticket.name} · ${ticket.subject}`,
      href: adminPath('/support'),
      at: parseAt(ticket.createdAt),
    });
  }

  for (const user of input.users) {
    const label = user.name ?? user.email ?? `User #${user.id}`;
    items.push({
      id: `user-${user.id}`,
      kind: 'user',
      title: 'New user',
      message: `${label} · ${user.provider}`,
      href: adminPath('/users'),
      at: parseAt(user.createdAt),
    });
  }

  return items.sort((a, b) => b.at - a.at);
}

export function formatNotificationTime(at: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const NOTIFICATION_KIND_LABEL: Record<AdminNotificationKind, string> = {
  order: 'Order',
  review: 'Review',
  support: 'Support',
  user: 'User',
};
