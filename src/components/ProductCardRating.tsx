'use client';

import type { Product } from '@/data/products';
import StarRating from '@/components/reviews/StarRating';

type Props = {
  product: Product;
};

/** Daraz-style average stars beside price on shop cards. */
export default function ProductCardRating({ product }: Props) {
  const summary = product.reviewSummary;
  if (!summary?.reviewCount) return null;

  return (
    <div
      className="product-card-rating"
      aria-label={`${summary.averageRating} out of 5 from ${summary.reviewCount} reviews`}
    >
      <StarRating value={summary.averageRating} size={14} />
      <span className="product-card-rating__value">{summary.averageRating.toFixed(1)}</span>
      <span className="product-card-rating__count">({summary.reviewCount})</span>
    </div>
  );
}
