import type { Product } from '@/data/products';

/** Local fallback — never use external placeholder URLs (often blocked/offline). */
import { siteConfig } from '@/lib/seo/site';

export const ADMIN_PRODUCT_IMAGE_FALLBACK = siteConfig.favicon32;

export function getProductTitleText(product: Product): string {
  if (typeof product.title === 'object') {
    return product.title.en || product.title.ar || 'Product';
  }
  return String(product.title || 'Product');
}

/** Match order line name to catalog image. */
export function getProductImageByName(
  productName: string,
  products: Product[],
): string {
  if (!productName?.trim()) return ADMIN_PRODUCT_IMAGE_FALLBACK;

  const needle = productName.toLowerCase().trim();
  const product = products.find((p) => {
    const titleEn = getProductTitleText(p).toLowerCase();
    const titleAr =
      typeof p.title === 'object' ? (p.title.ar || '').toLowerCase() : '';
    return (
      titleEn.includes(needle) ||
      needle.includes(titleEn) ||
      (titleAr && (titleAr.includes(needle) || needle.includes(titleAr)))
    );
  });

  const src = product?.image || product?.images?.[0];
  return src?.trim() ? src : ADMIN_PRODUCT_IMAGE_FALLBACK;
}
