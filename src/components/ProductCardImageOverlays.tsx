'use client';

import type { Product } from '@/data/products';
import ClothesStitchBadge from '@/components/ClothesImageBadges';
import FreeDeliveryBar from '@/components/FreeDeliveryBar';
import { saleOverlayClass } from '@/lib/product-badge-classes';

/** Discount, stitch, and free-delivery bar on product image (shop cards) */
export default function ProductCardImageOverlays({ product }: { product: Product }) {
  return (
    <>
      {product.discount > 0 ? (
        <span className={saleOverlayClass()}>{product.discount}% OFF</span>
      ) : null}

      <ClothesStitchBadge product={product} overlay />

      {product.freeDelivery ? <FreeDeliveryBar /> : null}
    </>
  );
}
