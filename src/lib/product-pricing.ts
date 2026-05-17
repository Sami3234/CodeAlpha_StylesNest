import type { Product } from '@/data/products';

/** Line total in PKR (pricing tier price is total for that quantity). */
export function getLineTotal(product: Product, quantity: number): number {
  const q = Math.max(1, Math.min(99, Math.floor(Number(quantity)) || 1));
  const tiers = product.pricingTiers?.filter((t) => t.quantity > 0 && t.price >= 0) ?? [];

  if (tiers.length > 0) {
    const exact = tiers.find((t) => t.quantity === q);
    if (exact) return exact.price;
  }

  return product.currentPrice * q;
}

export function getUnitPrice(product: Product, quantity: number): number {
  const q = Math.max(1, Math.floor(Number(quantity)) || 1);
  return getLineTotal(product, q) / q;
}

export function formatTierHint(product: Product): string | null {
  const tiers = product.pricingTiers?.filter((t) => t.quantity > 1) ?? [];
  if (!tiers.length) return null;
  const best = [...tiers].sort((a, b) => a.quantity - b.quantity)[0];
  return `From ${best.quantity}+ pcs special pricing available`;
}
