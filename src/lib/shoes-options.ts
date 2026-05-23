export type ShoesGender = 'men' | 'women';

export interface ShoesOptions {
  gender: ShoesGender;
  /** EU / standard shoe sizes (e.g. 36–46) */
  sizes: string[];
  colors?: string[];
}

/** Common EU sizes used for footwear in Pakistan online stores */
export const SHOE_SIZE_OPTIONS = [
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
] as const;

export const DEFAULT_SHOES_OPTIONS: ShoesOptions = {
  gender: 'women',
  sizes: ['38', '39', '40'],
  colors: [],
};

export function isShoesCategory(category: string | undefined): boolean {
  return category === 'shoes';
}

export function parseShoesOptions(raw: unknown): ShoesOptions | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const o = raw as Record<string, unknown>;
  const gender = o.gender === 'men' || o.gender === 'women' ? o.gender : null;
  if (!gender) return undefined;

  const sizesRaw = Array.isArray(o.sizes) ? o.sizes : [];
  const sizes = sizesRaw
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim());

  const colorsRaw = Array.isArray(o.colors) ? o.colors : [];
  const colors = colorsRaw
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .map((c) => c.trim());

  return { gender, sizes, colors };
}

export function shoesGenderLabel(gender: ShoesGender): string {
  return gender === 'men' ? 'Men' : 'Women';
}

export function shoesSizesDisplayLabel(options: ShoesOptions): {
  label: string;
  value: string;
} | null {
  if (options.sizes.length === 0) return null;
  return {
    label: options.sizes.length > 1 ? 'Sizes' : 'Size',
    value: options.sizes.join(' · '),
  };
}

export function shoesColorsDisplayLabel(options: ShoesOptions): {
  label: string;
  value: string;
} | null {
  const colors = options.colors?.filter((c) => c.trim()) ?? [];
  if (colors.length === 0) return null;
  return {
    label: colors.length > 1 ? 'Colors' : 'Color',
    value: colors.join(' · '),
  };
}

export function shoesOrderProductNameWithOptions(
  title: string,
  options: ShoesOptions | undefined,
  selectedSize?: string,
  selectedColor?: string,
): string {
  if (!options) return title;
  const parts: string[] = [shoesGenderLabel(options.gender)];
  if (selectedSize?.trim()) parts.push(`Size ${selectedSize.trim()}`);
  if (selectedColor?.trim()) parts.push(`Color ${selectedColor.trim()}`);
  return `${title} — ${parts.join(', ')}`;
}

export function validateShoesOptions(
  options: ShoesOptions | undefined,
): { valid: boolean; error?: string } {
  if (!options) {
    return { valid: false, error: 'Select Men or Women and at least one shoe size.' };
  }
  if (!options.gender) {
    return { valid: false, error: 'Select Men or Women.' };
  }
  if (!options.sizes.length) {
    return { valid: false, error: 'Select at least one shoe size.' };
  }
  return { valid: true };
}

/** Read variant options from a product (clothes or shoes). */
export function getProductVariantOptions(product: {
  category: string;
  clothesOptions?: { gender?: string; sizes?: string[]; colors?: string[]; stitch?: string };
  shoesOptions?: ShoesOptions;
}): { gender?: string; sizes: string[]; colors: string[]; isShoes: boolean } | null {
  if (isShoesCategory(product.category) && product.shoesOptions) {
    return {
      gender: product.shoesOptions.gender,
      sizes: product.shoesOptions.sizes,
      colors: product.shoesOptions.colors ?? [],
      isShoes: true,
    };
  }
  if (product.category === 'clothes' && product.clothesOptions) {
    return {
      gender: product.clothesOptions.gender,
      sizes: product.clothesOptions.sizes ?? [],
      colors: product.clothesOptions.colors ?? [],
      isShoes: false,
    };
  }
  return null;
}
