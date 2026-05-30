import type { Product } from '@/data/products';

/** Flat delivery fee when cart order has 2+ different products (StylesNest covers the rest). */
export const CART_COMBINED_DELIVERY_FEE = 250;

/** Delivery charge for one product (0 when free delivery). */
export function getProductDeliveryCharge(
  product: Pick<Product, 'freeDelivery' | 'deliveryCharge'>,
): number {
  if (product.freeDelivery) return 0;
  const charge = Number(product.deliveryCharge);
  if (!Number.isFinite(charge) || charge <= 0) return 0;
  return Math.round(charge);
}

export function getUniqueOrderProductIds(lineProductIds: number[]): number[] {
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const productId of lineProductIds) {
    const id = Math.floor(Number(productId));
    if (!Number.isFinite(id) || id < 1 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Single product order → that product's delivery charge.
 * Multiple different products → flat 250 PKR when any line would incur delivery (not summed).
 */
export function getOrderDeliveryFee(
  products: Array<Pick<Product, 'id' | 'freeDelivery' | 'deliveryCharge'>>,
  lineProductIds: number[],
): number {
  const uniqueIds = getUniqueOrderProductIds(lineProductIds);
  if (uniqueIds.length === 0) return 0;

  if (uniqueIds.length === 1) {
    const product = products.find((p) => Number(p.id) === uniqueIds[0]);
    return product ? getProductDeliveryCharge(product) : 0;
  }

  const anyPaidDelivery = uniqueIds.some((id) => {
    const product = products.find((p) => Number(p.id) === id);
    return product ? getProductDeliveryCharge(product) > 0 : false;
  });

  return anyPaidDelivery ? CART_COMBINED_DELIVERY_FEE : 0;
}

export function getOrderGrandTotal(subtotal: number, deliveryFee: number): number {
  return subtotal + Math.max(0, deliveryFee);
}
