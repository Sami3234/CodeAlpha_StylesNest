import type { Order } from '@/types/order';

/** Product IDs for admin notifications (falls back to order id if lines lack productId). */
export function formatOrderProductIds(order: Order): string {
  const ids = order.products
    .map((p) => p.productId)
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0);

  if (ids.length > 0) {
    return ids.map((id) => String(id)).join(', ');
  }

  return order.id;
}
