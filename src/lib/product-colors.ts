import type { Product } from '@/data/products';
import { isClothesCategory } from '@/lib/clothes-options';
import { isShoesCategory } from '@/lib/shoes-options';

/** Categories where at least one color is required when adding a product. */
export const COLOR_REQUIRED_CATEGORIES = ['clothes', 'shoes'] as const;

export function categoryColorsRequired(category: string): boolean {
  return (COLOR_REQUIRED_CATEGORIES as readonly string[]).includes(category);
}

export function normalizeColorName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

export function normalizeColorList(colors: string[] | undefined): string[] {
  if (!colors?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of colors) {
    const n = normalizeColorName(c);
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

/** Read all colors customers can choose (aggregated from options + per-image lists). */
export function getProductAvailableColors(product: {
  category: string;
  clothesOptions?: { colors?: string[] };
  shoesOptions?: { colors?: string[] };
  productMeta?: { availableColors?: string[]; imageColors?: string[][] };
}): string[] {
  const merged: string[] = [];
  if (isShoesCategory(product.category)) {
    merged.push(...(product.shoesOptions?.colors ?? []));
  }
  if (isClothesCategory(product.category)) {
    merged.push(...(product.clothesOptions?.colors ?? []));
  }
  merged.push(...(product.productMeta?.availableColors ?? []));
  if (product.productMeta?.imageColors?.length) {
    for (const list of product.productMeta.imageColors) {
      merged.push(...list);
    }
  }
  return normalizeColorList(merged);
}

/** Initial colors when loading admin product form. */
export function getInitialProductColors(product: Product | null): string[] {
  if (!product) return [];
  return getProductAvailableColors(product);
}

/** Union of all colors listed under product images (deduped). */
export function aggregateImageColors(images: { colors?: string[] }[]): string[] {
  const merged: string[] = [];
  for (const img of images) {
    if (img.colors?.length) merged.push(...img.colors);
  }
  return normalizeColorList(merged);
}

/** Colors for one gallery image index (uses saved per-image map when present). */
export function getProductImageColorLabels(
  product: {
    images?: string[];
    image?: string;
    category: string;
    clothesOptions?: { colors?: string[] };
    shoesOptions?: { colors?: string[] };
    productMeta?: { imageColors?: string[][]; availableColors?: string[] };
  },
  imageIndex: number,
): string[] {
  const perImage = product.productMeta?.imageColors;
  if (perImage && imageIndex >= 0 && imageIndex < perImage.length) {
    const mapped = normalizeColorList(perImage[imageIndex]);
    if (mapped.length) return mapped;
  }

  const legacy = getProductAvailableColors(product);
  if (!legacy.length) return [];

  const imageCount =
    product.images?.filter((u) => u?.trim()).length ||
    (product.image?.trim() ? 1 : 0);

  if (!perImage?.length) {
    if (legacy.length === imageCount && imageCount > 1) {
      return legacy[imageIndex] ? [legacy[imageIndex]] : [];
    }
    if (imageIndex === 0) return legacy;
    return [];
  }

  return [];
}

export function getProductImageColorDisplay(
  product: Parameters<typeof getProductImageColorLabels>[0],
  imageIndex: number,
): { label: string; value: string } | null {
  const colors = getProductImageColorLabels(product, imageIndex);
  if (!colors.length) return null;
  return {
    label: colors.length > 1 ? 'Colors' : 'Color',
    value: colors.join(' · '),
  };
}

export function validateProductImageColors(
  images: { id: string; colors?: string[] }[],
  category: string,
): { valid: boolean; error?: string; imageErrors: Record<string, string> } {
  if (!categoryColorsRequired(category)) {
    return { valid: true, imageErrors: {} };
  }
  const imageErrors: Record<string, string> = {};
  for (const img of images) {
    if (!normalizeColorList(img.colors).length) {
      imageErrors[img.id] = 'Add at least one color for this image.';
    }
  }
  if (Object.keys(imageErrors).length === 0) {
    return { valid: true, imageErrors: {} };
  }
  return {
    valid: false,
    error: 'Add a color under each product image (required for clothes & shoes).',
    imageErrors,
  };
}

export function productColorsDisplayLabel(colors: string[]): {
  label: string;
  value: string;
} | null {
  const list = normalizeColorList(colors);
  if (list.length === 0) return null;
  return {
    label: list.length > 1 ? 'Colors' : 'Color',
    value: list.join(' · '),
  };
}
