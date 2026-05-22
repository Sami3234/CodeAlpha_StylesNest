'use client';

import Image from 'next/image';
import { ADMIN_PRODUCT_IMAGE_FALLBACK } from '@/lib/admin-product-image';

type Props = {
  src?: string | null;
  alt: string;
  sizes?: string;
  unoptimized?: boolean;
  style?: React.CSSProperties;
};

/** Small admin product thumbnail with required `sizes` for Next/Image fill. */
export default function AdminThumbImage({
  src,
  alt,
  sizes = '80px',
  unoptimized = true,
  style,
}: Props) {
  const imageSrc = src?.trim() ? src : ADMIN_PRODUCT_IMAGE_FALLBACK;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes={sizes}
      style={{ objectFit: 'cover', ...style }}
      unoptimized={unoptimized}
    />
  );
}
