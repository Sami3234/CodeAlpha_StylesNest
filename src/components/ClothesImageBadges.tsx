'use client';

import { motion } from 'framer-motion';
import type { Product } from '@/data/products';
import { categoryShowsGender } from '@/lib/category-form-fields';
import { clothesColorsDisplayLabel, shoesColorsDisplayLabel } from '@/lib/cart-line-options';
import {
  clothesGenderLabel,
  clothesSizesDisplayLabel,
  clothesStitchLabel,
  isClothesCategory,
  isClothesSizeRequired,
} from '@/lib/clothes-options';
import {
  categoryColorsRequired,
  getProductAvailableColors,
  productColorsDisplayLabel,
} from '@/lib/product-colors';
import {
  isShoesCategory,
  shoesGenderLabel,
  shoesSizesDisplayLabel,
} from '@/lib/shoes-options';
import {
  genderBadgeClass,
  genderImageBadgeClass,
  stitchImageBadgeClass,
  stitchOverlayClass,
} from '@/lib/product-badge-classes';

/** Stitched / Unstitched on product image only */
export default function ClothesStitchBadge({
  product,
  animated = false,
  overlay = false,
}: {
  product: Product;
  animated?: boolean;
  /** Shop card: bottom-right tag with flat design */
  overlay?: boolean;
}) {
  if (!isClothesCategory(product.category) || !product.clothesOptions) {
    return null;
  }

  const stitch = product.clothesOptions.stitch;
  const className = overlay ? stitchOverlayClass(stitch) : stitchImageBadgeClass(stitch);

  if (animated) {
    return (
      <motion.span
        className={className}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {clothesStitchLabel(stitch)}
      </motion.span>
    );
  }

  return <span className={className}>{clothesStitchLabel(stitch)}</span>;
}

/** Men / Women badge on shoe product image */
export function ShoesGenderBadge({
  product,
  animated = false,
}: {
  product: Product;
  animated?: boolean;
}) {
  if (!isShoesCategory(product.category) || !product.shoesOptions?.gender) {
    return null;
  }

  const gender = product.shoesOptions.gender;
  const className = genderImageBadgeClass(gender);
  const label = shoesGenderLabel(gender);

  if (animated) {
    return (
      <motion.span
        className={className}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {label}
      </motion.span>
    );
  }
  return <span className={className}>{label}</span>;
}

/** Available colors — display only */
export function ClothesColorsLine({ product }: { product: Product }) {
  const colors = getProductAvailableColors(product);
  if (colors.length === 0) return null;

  if (isShoesCategory(product.category) && product.shoesOptions) {
    const display = shoesColorsDisplayLabel(product.shoesOptions);
    if (display) {
      return (
        <p className="pc-meta-line">
          <span className="pc-meta-label">{display.label}: </span>
          {display.value}
        </p>
      );
    }
  }

  if (isClothesCategory(product.category) && product.clothesOptions) {
    const display = clothesColorsDisplayLabel(product.clothesOptions);
    if (display) {
      return (
        <p className="pc-meta-line">
          <span className="pc-meta-label">{display.label}: </span>
          {display.value}
        </p>
      );
    }
  }

  const display = productColorsDisplayLabel(colors);
  if (!display) return null;

  return (
    <p className="pc-meta-line">
      <span className="pc-meta-label">{display.label}: </span>
      {display.value}
    </p>
  );
}

/** Available sizes — left aligned (display only) */
export function ClothesSizesLine({ product }: { product: Product }) {
  if (isShoesCategory(product.category) && product.shoesOptions) {
    const display = shoesSizesDisplayLabel(product.shoesOptions);
    if (!display) return null;
    return (
      <p className="pc-meta-line">
        <span className="pc-meta-label">{display.label}: </span>
        {display.value}
      </p>
    );
  }

  if (!isClothesCategory(product.category) || !product.clothesOptions) {
    return null;
  }

  const display = clothesSizesDisplayLabel(product.clothesOptions);
  if (!display) return null;

  return (
    <p className="pc-meta-line">
      <span className="pc-meta-label">{display.label}: </span>
      {display.value}
    </p>
  );
}

/** Men / Women — right column badge */
export function ClothesGenderNearPrice({ product }: { product: Product }) {
  if (isShoesCategory(product.category) && product.shoesOptions?.gender) {
    return (
      <span className={genderBadgeClass(product.shoesOptions.gender)}>
        {shoesGenderLabel(product.shoesOptions.gender)}
      </span>
    );
  }

  if (!categoryShowsGender(product.category) || !product.clothesOptions?.gender) {
    return null;
  }

  return (
    <span className={genderBadgeClass(product.clothesOptions.gender)}>
      {clothesGenderLabel(product.clothesOptions.gender)}
    </span>
  );
}

/** Sizes left, gender right — below title / near price */
export function ClothesMetaRow({ product }: { product: Product }) {
  const hasShoes = isShoesCategory(product.category) && product.shoesOptions;
  const hasClothes = isClothesCategory(product.category) && product.clothesOptions;
  if (!hasShoes && !hasClothes) {
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
        <div
          style={{
            marginTop:
              (hasClothes && product.clothesOptions?.colors?.length) ||
              (hasShoes && product.shoesOptions?.colors?.length)
                ? 4
                : 0,
          }}
        >
          <ClothesColorsLine product={product} />
        </div>
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
  const shoeSizes =
    isShoesCategory(product.category) && product.shoesOptions?.sizes.length
      ? product.shoesOptions.sizes
      : null;
  const clothesSizes =
    isClothesCategory(product.category) && product.clothesOptions?.sizes.length
      ? product.clothesOptions.sizes
      : null;

  const sizes = shoeSizes ?? clothesSizes;
  if (!sizes?.length) return null;

  const isStitched = product.clothesOptions
    ? isClothesSizeRequired(product.clothesOptions.stitch)
    : true;

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
        {shoeSizes ? 'Select Shoe Size' : 'Select Size'}
        {isStitched ? (
          <span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
        ) : (
          <span style={{ color: '#718096', marginLeft: '6px', fontWeight: 500, fontSize: '13px' }}>
            (optional)
          </span>
        )}
      </label>
      <div className="flex flex-wrap gap-2.5">
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
      </div>
    </motion.div>
  );
}

/** Color picker in order form / add-to-cart modal */
export function ClothesColorSelector({
  product,
  value,
  onChange,
}: {
  product: Product;
  value: string;
  onChange: (color: string) => void;
}) {
  const colors = getProductAvailableColors(product);

  if (colors.length === 0) {
    return null;
  }

  const colorRequired = categoryColorsRequired(product.category) || colors.length > 0;

  return (
    <div>
      <label
        className="block text-[15px] font-semibold text-[#2d3748] mb-2.5"
      >
        Select Color
        {colorRequired ? <span className="text-[#e53e3e] ml-1">*</span> : null}
      </label>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: `2px solid ${selected ? '#c44569' : 'rgba(196, 69, 105, 0.25)'}`,
                background: selected ? '#c44569' : '#fff',
                color: selected ? '#fff' : '#4a5568',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {color}
            </button>
          );
        })}
      </div>
    </div>
  );
}
