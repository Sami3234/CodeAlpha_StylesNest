/**
 * Calculate sold count for a product from orders (client-side fallback).
 * Prefer product.soldCount from the database when available.
 */

import type { Order } from '@/types/order';
import { Product } from '@/data/products';
import {
  aggregateQuantitiesByProductId,
  isCancelledOrderStatus,
} from '@/lib/product-sold-count';

export function getSoldCount(product: Product, orders: Order[]): number {
  if (!product?.id || !orders?.length) {
    return product?.soldCount ?? 0;
  }

  const productId = Math.floor(Number(product.id));
  if (!Number.isFinite(productId) || productId < 1) {
    return product.soldCount ?? 0;
  }

  let soldCount = 0;

  for (const order of orders) {
    if (isCancelledOrderStatus(order.status)) continue;
    for (const line of order.products) {
      const lineId =
        typeof line.productId === 'number' ? Math.floor(line.productId) : 0;
      if (lineId === productId) {
        soldCount += Math.floor(Number(line.quantity)) || 0;
      }
    }
  }

  return soldCount;
}

/** Sum sold quantities across orders (all products). */
export function getSoldTotalsFromOrders(orders: Order[]): Map<number, number> {
  const totals = new Map<number, number>();
  for (const order of orders) {
    if (isCancelledOrderStatus(order.status)) continue;
    for (const [id, qty] of aggregateQuantitiesByProductId(order.products)) {
      totals.set(id, (totals.get(id) ?? 0) + qty);
    }
  }
  return totals;
}

