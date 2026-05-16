'use client';

import { motion } from 'framer-motion';
import type { Product } from '@/data/products';
import { categoryShowsGender } from '@/lib/category-form-fields';
import {
  clothesGenderLabel,
  clothesSizesDisplayLabel,
  clothesStitchLabel,
  isClothesCategory,
  isClothesSizeRequired,
} from '@/lib/clothes-options';

const stitchBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 10,
  bottom: '12px',
  right: '12px',
  fontSize: '11px',
  fontWeight: 600,
  padding: '7px 14px',
  borderRadius: '30px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  border: '1px solid rgba(255,255,255,0.4)',
  color: '#fff',
};

/** Stitched / Unstitched on product image only */
export default function ClothesStitchBadge({
  product,
  animated = false,
}: {
  product: Product;
  animated?: boolean;
}) {
  if (!isClothesCategory(product.category) || !product.clothesOptions) {
    return null;
  }

  const stitch = product.clothesOptions.stitch;
  const style: React.CSSProperties = {
    ...stitchBadgeStyle,
    background:
      stitch === 'stitched'
        ? 'linear-gradient(135deg, #d69e2e 0%, #b7791f 50%, #ecc94b 100%)'
        : 'linear-gradient(135deg, #805ad5 0%, #6b46c1 50%, #9f7aea 100%)',
    boxShadow:
      stitch === 'stitched'
        ? '0px 6px 20px rgba(214, 158, 46, 0.55)'
        : '0px 6px 20px rgba(128, 90, 213, 0.55)',
  };

  if (animated) {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={style}
      >
        {clothesStitchLabel(stitch)}
      </motion.span>
    );
  }

  return <span style={style}>{clothesStitchLabel(stitch)}</span>;
}

/** Available sizes — left aligned (display only) */
export function ClothesSizesLine({ product }: { product: Product }) {
  if (!isClothesCategory(product.category) || !product.clothesOptions) {
    return null;
  }

  const display = clothesSizesDisplayLabel(product.clothesOptions);
  if (!display) return null;

  return (
    <p
      style={{
        margin: 0,
        fontSize: '13px',
        fontWeight: 600,
        color: '#4a5568',
        textAlign: 'left',
      }}
    >
      <span style={{ color: '#718096', fontWeight: 500 }}>{display.label}: </span>
      {display.value}
    </p>
  );
}

/** Men / Women — right column badge */
export function ClothesGenderNearPrice({ product }: { product: Product }) {
  if (!categoryShowsGender(product.category) || !product.clothesOptions?.gender) {
    return null;
  }

  return (
    <span className="clothes-gender-badge">
      {clothesGenderLabel(product.clothesOptions.gender)}
    </span>
  );
}

/** Sizes left, gender right — below title / near price */
export function ClothesMetaRow({ product }: { product: Product }) {
  if (!isClothesCategory(product.category) || !product.clothesOptions) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginTop: '10px',
        width: '100%',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <ClothesSizesLine product={product} />
      </div>
      <ClothesGenderNearPrice product={product} />
    </motion.div>
  );
}

/** Size picker in order form */
export function ClothesSizeSelector({
  product,
  value,
  onChange,
}: {
  product: Product;
  value: string;
  onChange: (size: string) => void;
}) {
  if (!isClothesCategory(product.category) || !product.clothesOptions?.sizes.length) {
    return null;
  }

  const sizes = product.clothesOptions.sizes;
  const isStitched = isClothesSizeRequired(product.clothesOptions.stitch);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.65 }}
    >
      <label
        style={{
          display: 'block',
          fontSize: '15px',
          fontWeight: 600,
          color: '#2d3748',
          marginBottom: '10px',
        }}
      >
        Select Size
        {isStitched ? (
          <span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
        ) : (
          <span style={{ color: '#718096', marginLeft: '6px', fontWeight: 500, fontSize: '13px' }}>
            (optional)
          </span>
        )}
      </label>
      <motion.div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {sizes.map((size) => {
          const selected = value === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => {
                if (selected && !isStitched) {
                  onChange('');
                } else {
                  onChange(size);
                }
              }}
              style={{
                minWidth: '48px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: `2px solid ${selected ? '#667eea' : 'rgba(102, 126, 234, 0.25)'}`,
                background: selected ? '#667eea' : '#fff',
                color: selected ? '#fff' : '#4a5568',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {size}
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
