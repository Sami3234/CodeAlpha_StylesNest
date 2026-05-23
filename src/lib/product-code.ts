import { sql } from '@/lib/db';
import type { ProductMeta } from '@/lib/product-meta';
import { normalizeProductMetaForSave, parseProductMeta } from '@/lib/product-meta';

/** Category → 2-letter prefix for auto product IDs (e.g. CS#12051). */
export const CATEGORY_PRODUCT_CODE_PREFIX: Record<string, string> = {
  clothes: 'CS',
  lace: 'CS',
  jewelry: 'JY',
  ladiesbag: 'JY',
  watches: 'WT',
  wallets: 'WT',
  shoes: 'SH',
  cosmetics: 'CM',
  makeup: 'MK',
  electronics: 'EL',
  bags: 'BG',
  menfashion: 'MF',
  general: 'GN',
};

const PRODUCT_CODE_PATTERN = /^[A-Z]{2}#\d{5}$/;

let backfillPromise: Promise<void> | null = null;

export function getCategoryProductCodePrefix(category: string): string {
  const key = category.trim().toLowerCase();
  return CATEGORY_PRODUCT_CODE_PREFIX[key] ?? 'GN';
}

export function formatProductCode(prefix: string, number: number): string {
  return `${prefix}#${number}`;
}

export function isValidProductCode(value: string): boolean {
  return PRODUCT_CODE_PATTERN.test(value.trim().toUpperCase());
}

export function getProductCodeFromMeta(meta: ProductMeta | undefined): string {
  const sku = meta?.sku?.trim();
  if (!sku) return '';
  return sku.toUpperCase();
}

export function getProductCode(product: {
  productMeta?: ProductMeta;
}): string {
  return getProductCodeFromMeta(product.productMeta);
}

export async function productCodeExists(code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return false;
  const rows = await sql`
    SELECT id FROM products
    WHERE UPPER(TRIM(product_meta->>'sku')) = ${normalized}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function generateUniqueProductCode(category: string): Promise<string> {
  const prefix = getCategoryProductCodePrefix(category);

  for (let attempt = 0; attempt < 24; attempt++) {
    const number = 10000 + Math.floor(Math.random() * 90000);
    const code = formatProductCode(prefix, number);
    if (!(await productCodeExists(code))) return code;
  }

  for (let n = 10000; n <= 99999; n++) {
    const code = formatProductCode(prefix, n);
    if (!(await productCodeExists(code))) return code;
  }

  const fallback = formatProductCode(prefix, 10000 + Math.floor(Date.now() % 90000));
  return fallback;
}

/** Assign SKU on create; keep existing code on update. */
export async function resolveProductMetaForSave(
  meta: ProductMeta | undefined,
  category: string,
  options?: { preserveSku?: string | null },
): Promise<ProductMeta> {
  const parsed = normalizeProductMetaForSave(meta ?? {});
  const preserved = options?.preserveSku?.trim() || parsed.sku?.trim();
  if (preserved) {
    return { ...parsed, sku: preserved.toUpperCase() };
  }
  const sku = await generateUniqueProductCode(category);
  return { ...parsed, sku };
}

export async function getProductCodesByIds(ids: number[]): Promise<Map<number, string>> {
  const unique = [...new Set(ids.filter((id) => id > 0))];
  const map = new Map<number, string>();
  if (!unique.length) return map;

  for (const id of unique) {
    const rows = await sql`
      SELECT id, product_meta->>'sku' AS sku
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;
    const r = rows[0] as { id: number; sku: string | null } | undefined;
    const code = r?.sku?.trim();
    if (code && r) map.set(Number(r.id), code.toUpperCase());
  }
  return map;
}

async function backfillMissingProductCodes(): Promise<void> {
  const rows = await sql`
    SELECT id, category, product_meta
    FROM products
    WHERE product_meta->>'sku' IS NULL OR TRIM(product_meta->>'sku') = ''
    LIMIT 100
  `;

  for (const row of rows) {
    const id = Number((row as { id: number }).id);
    const category = String((row as { category: string }).category ?? 'general');
    const existing = parseProductMeta((row as { product_meta: unknown }).product_meta) ?? {};
    const sku = await generateUniqueProductCode(category);
    const nextMeta = normalizeProductMetaForSave({ ...existing, sku });
    await sql`
      UPDATE products
      SET product_meta = ${JSON.stringify(nextMeta)}::jsonb
      WHERE id = ${id}
    `;
  }
}

/** One-time per process: assign codes to legacy products missing SKU. */
export function ensureProductCodesBackfilled(): Promise<void> {
  if (!backfillPromise) {
    backfillPromise = backfillMissingProductCodes().catch((err) => {
      backfillPromise = null;
      throw err;
    });
  }
  return backfillPromise;
}
