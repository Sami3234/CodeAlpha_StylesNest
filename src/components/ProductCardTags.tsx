'use client';

import type { Product } from '@/data/products';
import { isShoesCategory, shoesGenderLabel } from '@/lib/shoes-options';
import { genderTagClass } from '@/lib/product-badge-classes';

/** Tags below image — only when not shown on image (e.g. shoes gender) */
export default function ProductCardTags({ product }: { product: Product }) {
  if (!isShoesCategory(product.category) || !product.shoesOptions?.gender) {
    return null;
  }

  const gender = product.shoesOptions.gender;

  return (
    <div className="pc-tags-row" aria-label="Product highlights">
      <span className={genderTagClass(gender)}>{shoesGenderLabel(gender)}</span>
    </div>
  );
}
