import type { ClothesOptions } from '@/lib/clothes-options';

/** Categories that show Men / Women selector */
export const GENDER_CATEGORIES = ['clothes', 'watches', 'jewelry', 'menfashion', 'bags'] as const;

export function categoryShowsGender(category: string): boolean {
  return (GENDER_CATEGORIES as readonly string[]).includes(category);
}

export function categoryShowsClothesPanel(category: string): boolean {
  return category === 'clothes';
}

export function validateCategoryOptions(
  category: string,
  options: ClothesOptions | undefined
): { valid: boolean; error?: string } {
  if (!categoryShowsGender(category) && !categoryShowsClothesPanel(category)) {
    return { valid: true };
  }

  if (!options?.gender) {
    return { valid: false, error: 'Select Men or Women.' };
  }

  if (categoryShowsClothesPanel(category)) {
    if (!options.stitch) {
      return { valid: false, error: 'Select Stitched or Unstitched.' };
    }
    if (options.stitch === 'stitched' && !options.sizes.length) {
      return { valid: false, error: 'Select at least one size (required for stitched items).' };
    }
  }

  return { valid: true };
}

export const CLOTHES_COLOR_PRESETS = [
  'Black',
  'White',
  'Navy',
  'Red',
  'Pink',
  'Green',
  'Blue',
  'Beige',
  'Brown',
  'Maroon',
  'Grey',
  'Multi',
] as const;
