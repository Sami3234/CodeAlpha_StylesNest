import type { Product } from '@/data/products';
import type { CartLine } from '@/context/CartContext';
import { buildCartLineKey, type CartLineOptions } from '@/lib/cart-line-options';

/** Stock is enforced only when admin saved `stockQuantity` in product meta. */
export function isStockTracked(product: Product): boolean {
  return typeof product.productMeta?.stockQuantity === 'number';
}

export function getStockLimit(product: Product): number | null {
  if (!isStockTracked(product)) return null;
  return Math.max(0, Math.floor(product.productMeta!.stockQuantity!));
}

export function isOutOfStock(product: Product): boolean {
  const limit = getStockLimit(product);
  return limit !== null && limit <= 0;
}

export function getCartQuantityForProduct(
  lines: CartLine[],
  productId: number,
  options?: CartLineOptions,
): number {
  const key = buildCartLineKey(productId, options);
  const line = lines.find((l) => l.lineKey === key);
  if (line) return line.quantity;
  if (options) return 0;
  return lines.filter((l) => l.productId === productId).reduce((s, l) => s + l.quantity, 0);
}

/** Max quantity allowed for this product (all cart lines combined). */
export function getMaxPurchasableQuantity(product: Product, lines: CartLine[]): number {
  const inCart = getCartQuantityForProduct(lines, product.id);
  const limit = getStockLimit(product);
  if (limit === null) return Math.max(0, 99 - inCart);
  return Math.max(0, Math.min(99, limit - inCart));
}

export function validateStockForQuantity(
  product: Product,
  lines: CartLine[],
  desiredTotalQty: number,
  options?: CartLineOptions,
): { ok: true; quantity: number } | { ok: false; error: string } {
  if (!isStockTracked(product)) {
    return { ok: true, quantity: Math.min(99, Math.max(1, desiredTotalQty)) };
  }

  const limit = getStockLimit(product)!;
  if (limit <= 0) {
    return { ok: false, error: 'This item is out of stock.' };
  }

  const otherLinesQty = options
    ? getCartQuantityForProduct(lines, product.id) -
      getCartQuantityForProduct(lines, product.id, options)
    : 0;

  const maxForLine = Math.max(0, limit - otherLinesQty);
  const q = Math.min(99, Math.max(1, Math.floor(desiredTotalQty)));

  if (q > maxForLine) {
    return {
      ok: false,
      error:
        maxForLine <= 0
          ? 'No more stock available for this item.'
          : `Only ${maxForLine} left in stock.`,
    };
  }

  return { ok: true, quantity: q };
}

export function validateStockForAdd(
  product: Product,
  lines: CartLine[],
  addQty: number,
  options?: CartLineOptions,
): { ok: true; quantity: number } | { ok: false; error: string } {
  const current = options
    ? getCartQuantityForProduct(lines, product.id, options)
    : getCartQuantityForProduct(lines, product.id);
  return validateStockForQuantity(product, lines, current + addQty, options);
}

export function stockStatusLabel(product: Product): string | null {
  if (!isStockTracked(product)) return null;
  const limit = getStockLimit(product)!;
  if (limit <= 0) return 'Out of stock';
  if (limit <= 5) return `Only ${limit} left`;
  return `In stock (${limit})`;
}
