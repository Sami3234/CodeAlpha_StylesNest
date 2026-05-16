import type { ProductMeta } from '@/lib/product-meta';

export type ProductMetaDisplayRow = {
  label: string;
  value: string;
  highlight?: 'success' | 'warning' | 'danger';
};

/** Customer-facing rows only (no cost price, no SEO fields). */
export function getProductMetaDisplayRows(meta: ProductMeta | undefined): ProductMetaDisplayRow[] {
  if (!meta) return [];

  const rows: ProductMetaDisplayRow[] = [];

  if (meta.brand?.trim()) {
    rows.push({ label: 'Brand', value: meta.brand.trim() });
  }
  if (meta.fabric?.trim()) {
    rows.push({ label: 'Fabric', value: meta.fabric.trim() });
  }
  if (meta.weightGrams != null && meta.weightGrams > 0) {
    const g = meta.weightGrams;
    const value =
      g >= 1000
        ? `${g % 1000 === 0 ? g / 1000 : (g / 1000).toFixed(1)} kg`
        : `${g} g`;
    rows.push({ label: 'Weight', value });
  }
  if (meta.sku?.trim()) {
    rows.push({ label: 'Product code', value: meta.sku.trim() });
  }

  if (meta.stockQuantity != null) {
    if (meta.stockQuantity <= 0) {
      rows.push({ label: 'Availability', value: 'Out of stock', highlight: 'danger' });
    } else if (meta.stockQuantity <= 5) {
      rows.push({
        label: 'Availability',
        value: `Only ${meta.stockQuantity} left`,
        highlight: 'warning',
      });
    } else {
      rows.push({ label: 'Availability', value: 'In stock', highlight: 'success' });
    }
  }

  return rows;
}

export function getProductMetaTags(meta: ProductMeta | undefined): string[] {
  return meta?.tags?.filter((t) => t.trim().length > 0) ?? [];
}

export function hasCustomerProductMeta(meta: ProductMeta | undefined): boolean {
  if (!meta) return false;
  return (
    Boolean(meta.shortSummary?.trim()) ||
    getProductMetaDisplayRows(meta).length > 0 ||
    getProductMetaTags(meta).length > 0
  );
}
