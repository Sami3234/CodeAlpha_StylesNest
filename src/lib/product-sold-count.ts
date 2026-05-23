import { sql } from '@/lib/db';
import { parseOrderProducts } from '@/lib/normalize-order-payload';
import type { OrderProduct } from '@/types/order';
import type { ValidatedOrderLine } from '@/lib/validate-order-request';

export function isCancelledOrderStatus(status: string | undefined | null): boolean {
  return String(status ?? '').trim().toLowerCase() === 'cancelled';
}

/** Sum quantities per product id (ignores lines without productId). */
export function aggregateQuantitiesByProductId(
  products: OrderProduct[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const line of products) {
    const productId =
      typeof line.productId === 'number' ? Math.floor(line.productId) : 0;
    if (productId < 1) continue;
    const qty = Math.floor(Number(line.quantity));
    if (!Number.isFinite(qty) || qty < 1) continue;
    map.set(productId, (map.get(productId) ?? 0) + qty);
  }
  return map;
}

async function applySoldCountDelta(deltaByProduct: Map<number, number>): Promise<void> {
  for (const [productId, delta] of deltaByProduct) {
    if (!delta) continue;
    await sql`
      UPDATE products
      SET
        sold_count = GREATEST(0, COALESCE(sold_count, 0) + ${delta}),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${productId}
    `;
  }
}

export async function incrementSoldCountForOrderLines(
  lines: ValidatedOrderLine[],
): Promise<void> {
  const map = new Map<number, number>();
  for (const line of lines) {
    map.set(line.productId, (map.get(line.productId) ?? 0) + line.quantity);
  }
  await applySoldCountDelta(map);
}

/** Adjust sold_count when order status or line items change. */
export async function reconcileSoldCountChange(
  previous: { status: string; products: OrderProduct[] },
  next: { status: string; products: OrderProduct[] },
): Promise<void> {
  const delta = new Map<number, number>();

  if (!isCancelledOrderStatus(previous.status)) {
    for (const [id, qty] of aggregateQuantitiesByProductId(previous.products)) {
      delta.set(id, (delta.get(id) ?? 0) - qty);
    }
  }

  if (!isCancelledOrderStatus(next.status)) {
    for (const [id, qty] of aggregateQuantitiesByProductId(next.products)) {
      delta.set(id, (delta.get(id) ?? 0) + qty);
    }
  }

  await applySoldCountDelta(delta);
}

/** Rebuild sold_count for every product from non-cancelled orders. */
export async function recalculateAllSoldCountsFromOrders(): Promise<{
  productsUpdated: number;
}> {
  const rows = await sql`
    SELECT status, products FROM orders
  `;

  const totals = new Map<number, number>();
  for (const row of rows) {
    const r = row as { status: string; products: unknown };
    if (isCancelledOrderStatus(r.status)) continue;
    const products = parseOrderProducts(r.products);
    for (const [id, qty] of aggregateQuantitiesByProductId(products)) {
      totals.set(id, (totals.get(id) ?? 0) + qty);
    }
  }

  const productRows = await sql`SELECT id FROM products`;
  for (const row of productRows) {
    const id = row.id as number;
    const count = totals.get(id) ?? 0;
    await sql`
      UPDATE products
      SET sold_count = ${count}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  }

  return { productsUpdated: productRows.length };
}

/** Real sold totals from non-cancelled orders (source of truth for display). */
export async function getSoldCountsMapFromOrders(): Promise<Map<number, number>> {
  const rows = await sql`
    SELECT status, products FROM orders
  `;

  const totals = new Map<number, number>();
  for (const row of rows) {
    const r = row as { status: string; products: unknown };
    if (isCancelledOrderStatus(r.status)) continue;
    const products = parseOrderProducts(r.products);
    for (const [id, qty] of aggregateQuantitiesByProductId(products)) {
      totals.set(id, (totals.get(id) ?? 0) + qty);
    }
  }
  return totals;
}

export function resolveSoldCountForProduct(
  productId: number,
  soldMap: Map<number, number>,
): number {
  const id = Math.floor(Number(productId));
  if (!Number.isFinite(id) || id < 1) return 0;
  return soldMap.get(id) ?? 0;
}

export function applyRealSoldCounts<T extends { id: number; soldCount: number }>(
  products: T[],
  soldMap: Map<number, number>,
): T[] {
  return products.map((p) => ({
    ...p,
    soldCount: resolveSoldCountForProduct(p.id, soldMap),
  }));
}

let soldCountsRepairStarted = false;

/** One-time per server instance: overwrite fake DB sold_count from orders. */
export function repairSoldCountsInBackground(): void {
  if (soldCountsRepairStarted) return;
  soldCountsRepairStarted = true;
  void recalculateAllSoldCountsFromOrders().catch((err) => {
    soldCountsRepairStarted = false;
    console.error('[sold-count] repair failed:', err);
  });
}
