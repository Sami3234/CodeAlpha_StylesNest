import type { Product } from '@/data/products';
import type { OrderProduct } from '@/types/order';

export function formatPickPoint(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

/** Pick point on order line, or live lookup from catalog for older orders. */
export function resolveOrderLinePickPoint(
  line: OrderProduct,
  catalog?: Product[],
): string | null {
  const snap = formatPickPoint(line.pickPoint);
  if (snap) return snap;
  if (line.productId == null || !catalog?.length) return null;
  const product = catalog.find((p) => Number(p.id) === Number(line.productId));
  return formatPickPoint(product?.productMeta?.pickPoint);
}

export function orderProductLineLabel(p: OrderProduct): string {
  const id =
    typeof p.productId === 'number' && p.productId > 0 ? `ID ${p.productId} · ` : '';
  const opts = [p.selectedSize, p.selectedColor].filter(Boolean).join(', ');
  const suffix = opts ? ` (${opts})` : '';
  return `${id}${p.name}${suffix}`;
}

export function orderProductPickPointSuffix(pickPoint: string | null): string {
  return pickPoint ? ` · Pick: ${pickPoint}` : '';
}

/** Packing slip — numeric product id for warehouse (not pick point). */
export function slipParcelProductId(line: OrderProduct): string {
  if (typeof line.productId === 'number' && line.productId > 0) {
    return String(Math.floor(line.productId));
  }
  return '—';
}

/** Packing slip — title without duplicate "ID n ·" prefix. */
export function slipParcelProductTitle(line: OrderProduct): string {
  const name = line.name.replace(/^ID\s+\d+\s*·\s*/i, '').trim();
  const opts = [line.selectedSize, line.selectedColor].filter(Boolean).join(', ');
  const suffix = opts ? ` (${opts})` : '';
  return `${name}${suffix}`;
}
