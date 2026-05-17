export type ClothesGender = 'men' | 'women';
export type ClothesStitch = 'stitched' | 'unstitched';

export interface ClothesOptions {
  gender: ClothesGender;
  stitch: ClothesStitch;
  sizes: string[];
  /** Available colors (clothes) */
  colors?: string[];
}

export const CLOTHES_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;

export const DEFAULT_CLOTHES_OPTIONS: ClothesOptions = {
  gender: 'women',
  stitch: 'stitched',
  sizes: ['M', 'L'],
  colors: [],
};

export function isClothesCategory(category: string | undefined): boolean {
  return category === 'clothes';
}

export function parseClothesOptions(raw: unknown): ClothesOptions | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const o = raw as Record<string, unknown>;
  const gender = o.gender === 'men' || o.gender === 'women' ? o.gender : null;
  const stitch = o.stitch === 'stitched' || o.stitch === 'unstitched' ? o.stitch : null;
  const sizesRaw = Array.isArray(o.sizes) ? o.sizes : [];
  const sizes = sizesRaw
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim().toUpperCase());
  const colorsRaw = Array.isArray(o.colors) ? o.colors : [];
  const colors = colorsRaw
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .map((c) => c.trim());

  if (!gender) return undefined;
  if (!stitch) {
    return { gender, stitch: 'stitched', sizes, colors };
  }
  if (stitch === 'stitched' && sizes.length === 0) {
    return { gender, stitch, sizes: [], colors };
  }

  return { gender, stitch, sizes, colors };
}

export function isClothesSizeRequired(stitch: ClothesStitch | undefined): boolean {
  return stitch === 'stitched';
}

/** Card / listing text for available sizes */
export function clothesSizesDisplayLabel(options: ClothesOptions): {
  label: string;
  value: string;
} | null {
  if (options.sizes.length > 0) {
    return {
      label: options.sizes.length > 1 ? 'Sizes' : 'Size',
      value: options.sizes.join(' · '),
    };
  }
  if (options.stitch === 'unstitched') {
    return { label: 'Size', value: 'Standard' };
  }
  return null;
}

export function clothesGenderLabel(gender: ClothesGender): string {
  return gender === 'men' ? 'Men' : 'Women';
}

export function clothesStitchLabel(stitch: ClothesStitch): string {
  return stitch === 'stitched' ? 'Stitched' : 'Unstitched';
}

export function clothesOrderProductNameWithOptions(
  title: string,
  options: ClothesOptions | undefined,
  selectedSize?: string,
  selectedColor?: string,
): string {
  if (!options) return title;
  const detailParts: string[] = [clothesGenderLabel(options.gender)];
  if (selectedSize?.trim()) detailParts.push(`Size ${selectedSize.trim()}`);
  if (selectedColor?.trim()) detailParts.push(`Color ${selectedColor.trim()}`);
  detailParts.push(clothesStitchLabel(options.stitch));
  return `${title} — ${detailParts.join(', ')}`;
}

/** @deprecated Use clothesOrderProductNameWithOptions */
export function clothesOrderProductNameWithSize(
  title: string,
  options: ClothesOptions | undefined,
  selectedSize?: string,
): string {
  return clothesOrderProductNameWithOptions(title, options, selectedSize);
}

export function validateClothesOptions(
  options: ClothesOptions | undefined
): { valid: boolean; error?: string } {
  if (!options) {
    return { valid: false, error: 'Select gender and stitch type.' };
  }
  if (!options.gender) {
    return { valid: false, error: 'Select Men or Women.' };
  }
  if (!options.stitch) {
    return { valid: false, error: 'Select Stitched or Unstitched.' };
  }
  if (options.stitch === 'stitched' && !options.sizes.length) {
    return { valid: false, error: 'Select at least one size (required for stitched items).' };
  }
  return { valid: true };
}
