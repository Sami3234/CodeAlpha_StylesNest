export interface ProductMeta {
  sku?: string;
  stockQuantity?: number;
  shortSummary?: string;
  tags?: string[];
  brand?: string;
  fabric?: string;
  weightGrams?: number;
  costPrice?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export const EMPTY_PRODUCT_META: ProductMeta = {
  sku: '',
  stockQuantity: 0,
  shortSummary: '',
  tags: [],
  brand: '',
  fabric: '',
  weightGrams: undefined,
  costPrice: undefined,
  seoTitle: '',
  seoDescription: '',
};

export function parseProductMeta(raw: unknown): ProductMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;

  const tagsRaw = Array.isArray(o.tags) ? o.tags : [];
  const tags = tagsRaw
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => t.trim());

  const stock =
    typeof o.stockQuantity === 'number' && !Number.isNaN(o.stockQuantity)
      ? Math.max(0, Math.floor(o.stockQuantity))
      : typeof o.stockQuantity === 'string' && o.stockQuantity.trim() !== ''
        ? Math.max(0, parseInt(o.stockQuantity, 10) || 0)
        : 0;

  const weightGrams =
    typeof o.weightGrams === 'number' && o.weightGrams > 0 ? o.weightGrams : undefined;
  const costPrice =
    typeof o.costPrice === 'number' && o.costPrice >= 0 ? o.costPrice : undefined;

  return {
    sku: typeof o.sku === 'string' ? o.sku.trim() : '',
    stockQuantity: stock,
    shortSummary: typeof o.shortSummary === 'string' ? o.shortSummary.trim() : '',
    tags,
    brand: typeof o.brand === 'string' ? o.brand.trim() : '',
    fabric: typeof o.fabric === 'string' ? o.fabric.trim() : '',
    weightGrams,
    costPrice,
    seoTitle: typeof o.seoTitle === 'string' ? o.seoTitle.trim() : '',
    seoDescription: typeof o.seoDescription === 'string' ? o.seoDescription.trim() : '',
  };
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function tagsToInput(tags: string[] | undefined): string {
  return tags?.join(', ') ?? '';
}

export function normalizeProductMetaForSave(meta: ProductMeta): ProductMeta {
  return {
    sku: meta.sku?.trim() || undefined,
    stockQuantity: Math.max(0, Math.floor(meta.stockQuantity ?? 0)),
    shortSummary: meta.shortSummary?.trim() || undefined,
    tags: meta.tags?.length ? meta.tags.map((t) => t.trim()).filter(Boolean) : undefined,
    brand: meta.brand?.trim() || undefined,
    fabric: meta.fabric?.trim() || undefined,
    weightGrams:
      meta.weightGrams != null && meta.weightGrams > 0 ? Math.round(meta.weightGrams) : undefined,
    costPrice: meta.costPrice != null && meta.costPrice >= 0 ? meta.costPrice : undefined,
    seoTitle: meta.seoTitle?.trim() || undefined,
    seoDescription: meta.seoDescription?.trim() || undefined,
  };
}
