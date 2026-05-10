/**
 * Utility function to calculate actual sold count for a product from orders
 * Matches product titles (both English and Arabic) with order product names
 */

import { Order } from '@/context/OrderContext';
import { Product } from '@/data/products';
import { getProductTitle } from './getProductText';

/**
 * Calculate actual sold count for a product from orders
 * Only counts orders that are not cancelled
 */
export function getSoldCount(product: Product, orders: Order[]): number {
  if (!product || !orders || orders.length === 0) {
    return 0;
  }

  // Get product title in English
  const productTitle = getProductTitle(product);

  // Count sold items from non-cancelled orders
  let soldCount = 0;

  orders.forEach(order => {
    // Skip cancelled orders
    if (order.status === 'cancelled') {
      return;
    }

    order.products.forEach(orderProduct => {
      // Match by product name (English only)
      if (
        orderProduct.name === productTitle ||
        orderProduct.name.trim() === productTitle.trim()
      ) {
        soldCount += orderProduct.quantity;
      }
    });
  });

  return soldCount;
}

