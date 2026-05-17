import type { Product } from '@/data/products';
import {
  clothesOrderProductNameWithOptions,
  isClothesCategory,
  isClothesSizeRequired,
  type ClothesOptions,
} from '@/lib/clothes-options';
import {
  isShoesCategory,
  shoesColorsDisplayLabel,
  shoesOrderProductNameWithOptions,
  type ShoesOptions,
} from '@/lib/shoes-options';

export type CartLineOptions = {
  selectedSize?: string;
  selectedColor?: string;
};

export function buildCartLineKey(productId: number, options?: CartLineOptions): string {
  const size = options?.selectedSize?.trim() ?? '';
  const color = options?.selectedColor?.trim() ?? '';
  return `${Math.floor(productId)}|${size}|${color}`;
}

function variantSizes(product: Product): string[] {
  if (isShoesCategory(product.category)) return product.shoesOptions?.sizes ?? [];
  if (isClothesCategory(product.category)) return product.clothesOptions?.sizes ?? [];
  return [];
}

function variantColors(product: Product): string[] {
  if (isShoesCategory(product.category)) {
    return product.shoesOptions?.colors?.filter((c) => c.trim()) ?? [];
  }
  if (isClothesCategory(product.category)) {
    return product.clothesOptions?.colors?.filter((c) => c.trim()) ?? [];
  }
  return [];
}

/** True when the customer must pick size and/or color before adding to cart. */
export function productNeedsCartOptions(product: Product): boolean {
  if (isShoesCategory(product.category) && product.shoesOptions) {
    const opts = product.shoesOptions;
    return opts.sizes.length > 0 || (opts.colors?.length ?? 0) > 0;
  }
  if (isClothesCategory(product.category) && product.clothesOptions) {
    const opts = product.clothesOptions;
    const hasSizes = opts.sizes.length > 0;
    const hasColors = (opts.colors?.length ?? 0) > 0;
    return hasSizes || hasColors;
  }
  return false;
}

export function clothesColorsDisplayLabel(options: ClothesOptions): {
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

export { shoesColorsDisplayLabel };

export function validateCartLineOptions(
  product: Product,
  line: CartLineOptions,
): { valid: boolean; error?: string } {
  if (isShoesCategory(product.category) && product.shoesOptions) {
    const opts = product.shoesOptions;
    const size = line.selectedSize?.trim() ?? '';
    const color = line.selectedColor?.trim() ?? '';
    const availableColors = opts.colors?.filter((c) => c.trim()) ?? [];

    if (opts.sizes.length > 0 && !size) {
      return { valid: false, error: 'Please select a shoe size.' };
    }
    if (size && !opts.sizes.includes(size)) {
      return { valid: false, error: 'Please select a valid shoe size.' };
    }
    if (availableColors.length > 0 && !color) {
      return { valid: false, error: 'Please select a color.' };
    }
    if (color && !availableColors.includes(color)) {
      return { valid: false, error: 'Please select a valid color.' };
    }
    return { valid: true };
  }

  if (!isClothesCategory(product.category) || !product.clothesOptions) {
    return { valid: true };
  }

  const opts = product.clothesOptions;
  const size = line.selectedSize?.trim() ?? '';
  const color = line.selectedColor?.trim() ?? '';
  const availableColors = opts.colors?.filter((c) => c.trim()) ?? [];

  if (isClothesSizeRequired(opts.stitch) && opts.sizes.length > 0 && !size) {
    return { valid: false, error: 'Please select a size.' };
  }
  if (size && !opts.sizes.includes(size)) {
    return { valid: false, error: 'Please select a valid size.' };
  }

  if (availableColors.length > 0 && !color) {
    return { valid: false, error: 'Please select a color.' };
  }
  if (color && !availableColors.includes(color)) {
    return { valid: false, error: 'Please select a valid color.' };
  }

  return { valid: true };
}

export function formatCartLineOptionsSummary(
  product: Product,
  line: CartLineOptions,
): string | null {
  const parts: string[] = [];
  const size = line.selectedSize?.trim();
  const color = line.selectedColor?.trim();

  if (size) parts.push(`Size: ${size}`);
  if (color) parts.push(`Color: ${color}`);

  if (parts.length === 0 && productNeedsCartOptions(product)) {
    const sizes = variantSizes(product);
    const colors = variantColors(product);
    if (isShoesCategory(product.category)) {
      if (sizes.length > 0) return 'Shoe size required — update in cart or remove item';
      if (colors.length > 0) return 'Color required — update in cart or remove item';
    }
    if (isClothesCategory(product.category) && product.clothesOptions) {
      if (isClothesSizeRequired(product.clothesOptions.stitch) && sizes.length > 0) {
        return 'Size required — edit on product page or remove item';
      }
      if (colors.length > 0) {
        return 'Color required — edit on product page or remove item';
      }
    }
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function buildOrderProductName(
  productTitle: string,
  product: Product,
  line: CartLineOptions,
): string {
  if (isShoesCategory(product.category) && product.shoesOptions) {
    return shoesOrderProductNameWithOptions(
      productTitle,
      product.shoesOptions,
      line.selectedSize,
      line.selectedColor,
    );
  }
  if (isClothesCategory(product.category) && product.clothesOptions) {
    return clothesOrderProductNameWithOptions(
      productTitle,
      product.clothesOptions,
      line.selectedSize,
      line.selectedColor,
    );
  }
  return productTitle;
}
