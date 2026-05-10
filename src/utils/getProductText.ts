/**
 * Helper function to get product text in English
 */

// Type for products that support both old and new formats
interface ProductText {
  id?: number | string;
  title?: string | { en: string; ar: string };
  titleAr?: string;
  description?: string | { en: string; ar: string };
  descriptionAr?: string;
  features?: string[] | { en: string[]; ar: string[] };
  featuresAr?: string[];
}

/**
 * Get product title in English
 */
export function getProductTitle(product: ProductText): string {
  if (!product) return '';
  
  // If product has nested title object, use English
  if (typeof product.title === 'object' && product.title.en) {
    return product.title.en;
  }
  
  // Old format - single string title
  return typeof product.title === 'string' ? product.title : '';
}


/**
 * Get product description in English
 */
export function getProductDescription(product: ProductText): string {
  if (!product) return '';
  
  // If product has nested description object, use English
  if (typeof product.description === 'object' && product.description.en) {
    return product.description.en;
  }
  
  // Old format
  return typeof product.description === 'string' ? product.description : '';
}

/**
 * Get product features in English
 */
export function getProductFeatures(product: ProductText): string[] {
  if (!product || !product.features) return [];
  
  // If features is nested object, use English
  if (typeof product.features === 'object' && 'en' in product.features) {
    return product.features.en || [];
  }
  
  // Old format - array
  if (Array.isArray(product.features)) {
    return product.features;
  }
  
  return [];
}

/**
 * Add product translations (no-op since we're English only now)
 * This function is kept for compatibility but does nothing
 */
export function addProductToI18n(product: ProductText) {
  // No-op: English only mode
}

