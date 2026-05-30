import type { Product } from '@/data/products';
import { parseClothesOptions } from '@/lib/clothes-options';
import { parseShoesOptions } from '@/lib/shoes-options';
import { parseProductMeta } from '@/lib/product-meta';

function normalizeProductStatus(raw: unknown): Product['status'] {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (s === 'inactive') return 'inactive';
  return 'active';
}

/** Map a DB row from `products` to the client `Product` shape. */
export function mapProductRow(row: Record<string, unknown>): Product {
  const featuresEn = row.features_en as string[] | null | undefined;
  const featuresAr = row.features_ar as string[] | null | undefined;

  return {
    id: row.id as number,
    title: {
      en: row.title_en as string,
      ar: row.title_ar as string,
    },
    description: {
      en: row.description_en as string,
      ar: row.description_ar as string,
    },
    currentPrice: parseFloat(String(row.current_price)),
    originalPrice: parseFloat(String(row.original_price)),
    discount: row.discount as number,
    image: row.image as string,
    images: (row.images as string[]) || [],
    freeDelivery: Boolean(row.free_delivery),
    deliveryCharge: Math.max(0, parseFloat(String(row.delivery_charge ?? 0)) || 0),
    soldCount: row.sold_count as number,
    category: row.category as string,
    features:
      featuresEn && featuresEn.length > 0
        ? {
            en: featuresEn,
            ar: featuresAr || [],
          }
        : undefined,
    pricingTiers: (row.pricing_tiers as Product['pricingTiers']) || [],
    status: normalizeProductStatus(row.status),
    clothesOptions: parseClothesOptions(row.clothes_options),
    shoesOptions: parseShoesOptions(row.shoes_options),
    productMeta: parseProductMeta(row.product_meta),
  };
}
