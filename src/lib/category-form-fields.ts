import type { ClothesOptions } from '@/lib/clothes-options';
import type { ShoesOptions } from '@/lib/shoes-options';
import { isShoesCategory, validateShoesOptions } from '@/lib/shoes-options';

/** Categories that show Men / Women selector */
export const GENDER_CATEGORIES = ['clothes', 'shoes', 'watches', 'jewelry', 'menfashion', 'bags'] as const;

export function categoryShowsGender(category: string): boolean {
  return (GENDER_CATEGORIES as readonly string[]).includes(category);
}

export function categoryShowsClothesPanel(category: string): boolean {
  return category === 'clothes';
}

export function categoryShowsShoesPanel(category: string): boolean {
  return isShoesCategory(category);
}

export function validateCategoryOptions(
  category: string,
  options: ClothesOptions | undefined,
  shoesOptions?: ShoesOptions | undefined,
): { valid: boolean; error?: string } {
  if (categoryShowsShoesPanel(category)) {
    return validateShoesOptions(shoesOptions);
  }

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

export { SHOE_SIZE_OPTIONS } from '@/lib/shoes-options';
