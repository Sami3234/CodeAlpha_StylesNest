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

/** Read available colors from clothes/shoes options or product meta. */
export function getProductAvailableColors(product: {
  category: string;
  clothesOptions?: { colors?: string[] };
  shoesOptions?: { colors?: string[] };
  productMeta?: { availableColors?: string[] };
}): string[] {
  if (isShoesCategory(product.category)) {
    const fromShoes = normalizeColorList(product.shoesOptions?.colors);
    if (fromShoes.length) return fromShoes;
  }
  if (isClothesCategory(product.category)) {
    const fromClothes = normalizeColorList(product.clothesOptions?.colors);
    if (fromClothes.length) return fromClothes;
  }
  return normalizeColorList(product.productMeta?.availableColors);
}

/** Initial colors when loading admin product form. */
export function getInitialProductColors(product: Product | null): string[] {
  if (!product) return [];
  return getProductAvailableColors(product);
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
